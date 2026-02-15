// Production House — Domain Management Library
// Handles custom domain management, verification, and DNS checking
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, SiteDomain, DomainVerificationStatus } from '@/types/database';
import { resolveTxt, resolveCname } from 'dns/promises';
import crypto from 'crypto';

/**
 * Generate a verification token for DNS record
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Validate domain format
 */
function validateDomainFormat(domain: string): boolean {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  return domainRegex.test(cleanDomain);
}

/**
 * Add a custom domain to a site
 * Creates site_domains record and generates verification CNAME record value
 */
export async function addCustomDomain(
  siteId: string,
  domain: string,
  domainType: 'custom' | 'subdomain' = 'custom'
): Promise<SiteDomain> {
  // Validate domain format
  if (!validateDomainFormat(domain)) {
    throw new Error('Invalid domain format');
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();

  const supabase = createAdminClient();

  // Check if domain already exists
  const { data: existingDomain } = await supabase
    .from('site_domains')
    .select('id')
    .eq('domain', cleanDomain)
    .single();

  if (existingDomain) {
    throw new Error('Domain is already in use');
  }

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Create verification record
  // Format: _verify.{domain} -> verify.productionhouse.ai
  const verificationRecord = `_verify.${cleanDomain}`;

  // Create domain record
  const { data, error } = await supabase
    .from('site_domains')
    .insert({
      site_id: siteId,
      domain: cleanDomain,
      domain_type: domainType,
      verification_status: 'pending',
      verification_record: `${verificationRecord}:verify.productionhouse.ai:${verificationToken}`,
      ssl_status: 'pending',
      last_checked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create domain record: ${error.message}`);
  }

  return data;
}

/**
 * Verify a domain by checking DNS CNAME record
 */
export async function verifyDomain(domainId: string): Promise<{ verified: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get domain record
  const { data: domain, error: fetchError } = await supabase
    .from('site_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (fetchError || !domain) {
    throw new Error('Domain not found');
  }

  if (!domain.verification_record) {
    throw new Error('No verification record found');
  }

  try {
    const [verificationRecord, expectedTarget, token] = domain.verification_record.split(':');

    // Check DNS CNAME record
    const verified = await checkDNS(domain.domain, verificationRecord, expectedTarget);

    // Update verification status
    const newStatus: DomainVerificationStatus = verified ? 'verifying' : 'pending';

    const { error: updateError } = await supabase
      .from('site_domains')
      .update({
        verification_status: newStatus,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    if (updateError) {
      throw new Error(`Failed to update domain status: ${updateError.message}`);
    }

    return { verified };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown DNS error';
    return {
      verified: false,
      error: errorMessage,
    };
  }
}

/**
 * Remove a domain from a site
 */
export async function removeDomain(domainId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('site_domains').delete().eq('id', domainId);

  if (error) {
    throw new Error(`Failed to delete domain: ${error.message}`);
  }
}

/**
 * Get domain status and verification information
 */
export async function getDomainStatus(domainId: string): Promise<SiteDomain> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('site_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error || !data) {
    throw new Error('Domain not found');
  }

  return data;
}

/**
 * Check DNS records for domain verification
 * Supports both CNAME and TXT record verification
 */
export async function checkDNS(
  domain: string,
  recordName: string,
  expectedValue: string
): Promise<boolean> {
  try {
    // Try to resolve CNAME first
    try {
      const cnameRecords = await resolveCname(recordName);
      if (cnameRecords.includes(expectedValue)) {
        return true;
      }
    } catch (cnameError) {
      // CNAME not found, try TXT record
    }

    // Try TXT record as fallback
    try {
      const txtRecords = await resolveTxt(domain);
      for (const record of txtRecords) {
        const txtValue = record.join('');
        if (txtValue.includes(`production-house-verify=`)) {
          return true;
        }
      }
    } catch (txtError) {
      // TXT record not found
    }

    return false;
  } catch (error) {
    console.error(`DNS check error for ${domain}:`, error);
    return false;
  }
}

/**
 * Update domain SSL status
 * Called by the edge function after verifying DNS
 */
export async function updateDomainSSLStatus(
  domainId: string,
  sslStatus: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('site_domains')
    .update({
      ssl_status: sslStatus,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (error) {
    throw new Error(`Failed to update SSL status: ${error.message}`);
  }
}

/**
 * Mark domain as active after verification and SSL provisioning
 */
export async function activateDomain(domainId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('site_domains')
    .update({
      verification_status: 'active',
      ssl_status: 'active',
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (error) {
    throw new Error(`Failed to activate domain: ${error.message}`);
  }
}

/**
 * Mark domain as failed after prolonged verification failure
 */
export async function failDomain(domainId: string, reason: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('site_domains')
    .update({
      verification_status: 'failed',
      ssl_status: `failed: ${reason}`,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (error) {
    throw new Error(`Failed to mark domain as failed: ${error.message}`);
  }
}

/**
 * Get all domains for a site
 */
export async function getSiteDomainsForVerification(
  siteId: string
): Promise<SiteDomain[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('site_domains')
    .select('*')
    .eq('site_id', siteId);

  if (error) {
    throw new Error(`Failed to fetch domains: ${error.message}`);
  }

  return data || [];
}

/**
 * Get domains pending verification
 */
export async function getDomainsForChecking(): Promise<SiteDomain[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('site_domains')
    .select('*')
    .in('verification_status', ['pending', 'verifying']);

  if (error) {
    throw new Error(`Failed to fetch pending domains: ${error.message}`);
  }

  return data || [];
}
