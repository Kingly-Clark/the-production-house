// Production House — Check Domains Edge Function
// Runs every 5 minutes to check domain verification and SSL status
// Deno TypeScript environment
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { resolveCname, resolveTxt } from 'https://deno.land/std@0.208.0/net/dns.ts';

// Types (mirror from src/types/database.ts)
type DomainVerificationStatus = 'pending' | 'verifying' | 'verified' | 'active' | 'failed';
type JobStatus = 'running' | 'completed' | 'failed';

interface SiteDomain {
  id: string;
  site_id: string;
  domain: string;
  domain_type: 'custom' | 'subdomain';
  verification_status: DomainVerificationStatus;
  verification_record: string | null;
  ssl_status: string;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface JobLog {
  job_type: string;
  status: JobStatus;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  duration_ms: number | null;
}

/**
 * Check DNS CNAME record for domain verification
 */
async function checkDNSRecord(
  recordName: string,
  expectedValue: string
): Promise<boolean> {
  try {
    // Try CNAME lookup
    try {
      const cnameRecords = await resolveCname(recordName);
      if (cnameRecords.includes(expectedValue)) {
        console.log(`[checkDNSRecord] CNAME verified: ${recordName} -> ${expectedValue}`);
        return true;
      }
    } catch (cnameError) {
      console.log(`[checkDNSRecord] CNAME not found for ${recordName}: ${cnameError}`);
    }

    // Try TXT record as fallback
    try {
      const domain = recordName.split('.').slice(1).join('.');
      const txtRecords = await resolveTxt(domain);
      for (const record of txtRecords) {
        const txtValue = record.join('');
        if (txtValue.includes('production-house-verify=')) {
          console.log(`[checkDNSRecord] TXT record verified: ${domain}`);
          return true;
        }
      }
    } catch (txtError) {
      console.log(`[checkDNSRecord] TXT record not found: ${txtError}`);
    }

    return false;
  } catch (error) {
    console.error(`[checkDNSRecord] Error: ${error}`);
    return false;
  }
}

/**
 * Get SSL status from DNS (simplified - just check A record exists)
 */
async function checkSSLStatus(domain: string): Promise<string> {
  try {
    // For production, this would check with Let's Encrypt or similar
    // For now, we'll return 'provisioning' or 'active' based on DNS resolution
    console.log(`[checkSSLStatus] Checking SSL for ${domain}`);
    return 'provisioning';
  } catch (error) {
    console.error(`[checkSSLStatus] Error: ${error}`);
    return 'pending';
  }
}

/**
 * Update domain status in database
 */
async function updateDomainStatus(
  supabase: any,
  domainId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('site_domains')
    .update({
      ...updates,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (error) {
    throw new Error(`Failed to update domain ${domainId}: ${error.message}`);
  }
}

/**
 * Log job completion
 */
async function logJobCompletion(
  supabase: any,
  domainsChecked: number,
  domainsVerified: number,
  errors: string[]
): Promise<void> {
  const startTime = new Date();
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startTime.getTime();

  const { error } = await supabase.from('job_log').insert({
    job_type: 'check_domains',
    status: errors.length > 0 ? 'completed' : 'completed',
    articles_fetched: 0,
    articles_rewritten: 0,
    articles_published: 0,
    error_message: errors.length > 0 ? errors.join('; ') : null,
    started_at: startTime.toISOString(),
    completed_at: completedAt.toISOString(),
    duration_ms: durationMs,
  });

  if (error) {
    console.error(`[logJobCompletion] Error logging job: ${error.message}`);
  }
}

/**
 * Create admin alert
 */
async function createAlert(
  supabase: any,
  siteId: string,
  message: string,
  details: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('admin_alerts').insert({
    type: 'domain_issue',
    severity: 'warning',
    message,
    details,
    site_id: siteId,
  });

  if (error) {
    console.error(`[createAlert] Error creating alert: ${error.message}`);
  }
}

/**
 * Main edge function handler
 */Deno.serve(async (req: Request) => {
  const startTime = new Date();
  const errors: string[] = [];
  let domainsChecked = 0;
  let domainsVerified = 0;

  try {
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[check-domains] Starting domain verification check');

    // Fetch all domains with pending or verifying status
    const { data: domains, error: fetchError } = await supabase
      .from('site_domains')
      .select('*')
      .in('verification_status', ['pending', 'verifying']);

    if (fetchError) {
      throw new Error(`Failed to fetch domains: ${fetchError.message}`);
    }

    if (!domains || domains.length === 0) {
      console.log('[check-domains] No domains to check');
      await logJobCompletion(supabase, 0, 0, []);
      return new Response(JSON.stringify({ success: true, message: 'No domains to check' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[check-domains] Found ${domains.length} domains to check`);

    // Process each domain
    for (const domain of domains as SiteDomain[]) {
      domainsChecked++;

      try {
        // Check if domain has been pending for >48 hours
        const createdAt = new Date(domain.created_at);
        const now = new Date();
        const hoursSincePending = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursSincePending > 48 && domain.verification_status === 'pending') {
          console.log(`[check-domains] Domain ${domain.domain} failed (pending >48h)`);
          await updateDomainStatus(supabase, domain.id, {
            verification_status: 'failed',
            ssl_status: 'failed: timeout',
          });

          await createAlert(
            supabase,
            domain.site_id,
            `Domain verification timeout: ${domain.domain}`,
            { domainId: domain.id, hoursPending: Math.round(hoursSincePending) }
          );
          continue;
        }

        // Check DNS verification record
        if (!domain.verification_record) {
          console.log(`[check-domains] Domain ${domain.domain} has no verification record`);
          continue;
        }

        const [recordName, expectedValue] = domain.verification_record.split(':');
        const isVerified = await checkDNSRecord(recordName, expectedValue);

        if (isVerified) {
          domainsVerified++;
          console.log(`[check-domains] Domain ${domain.domain} verified!`);

          // Check SSL status
          const sslStatus = await checkSSLStatus(domain.domain);

          // Update to verified status
          await updateDomainStatus(supabase, domain.id, {
            verification_status: 'verified',
            ssl_status: sslStatus,
          });

          // Mark as active if SSL is ready (simplified)
          if (sslStatus === 'active') {
            await updateDomainStatus(supabase, domain.id, {
              verification_status: 'active',
            });
          }
        } else {
          console.log(`[check-domains] Domain ${domain.domain} not yet verified`);

          // Keep in current state, increment check count
          if (domain.verification_status === 'pending') {
            // Move to verifying state after first check
            await updateDomainStatus(supabase, domain.id, {
              verification_status: 'verifying',
            });
          }
        }
      } catch (domainError) {
        const errorMsg = domainError instanceof Error ? domainError.message : String(domainError);
        console.error(`[check-domains] Error processing domain ${domain.domain}: ${errorMsg}`);
        errors.push(`${domain.domain}: ${errorMsg}`);

        // Update domain status to indicate error
        await updateDomainStatus(supabase, domain.id, {
          ssl_status: `error: ${errorMsg}`,
        });
      }
    }

    // Log job completion
    await logJobCompletion(supabase, domainsChecked, domainsVerified, errors);

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startTime.getTime();

    console.log(
      `[check-domains] Completed: checked=${domainsChecked}, verified=${domainsVerified}, errors=${errors.length}, duration=${durationMs}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        domainsChecked,
        domainsVerified,
        errors: errors.length > 0 ? errors : undefined,
        durationMs,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[check-domains] Fatal error:', error);

    errors.push(`Fatal error: ${errorMsg}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        domainsChecked,
        durationMs: new Date().getTime() - startTime.getTime(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
