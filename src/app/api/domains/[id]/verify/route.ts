// Production House — Domain Verification API Route
// Manually trigger domain verification check
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { verifyDomain, getDomainStatus } from '@/lib/domains';
import { getVercelVerificationRecords, isVercelDomainMisconfigured } from '@/lib/domains/vercel';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/domains/[id]/verify
 * Manually trigger verification check for a domain
 * Returns current verification status and any records needed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: domainId } = await params;

    // Get domain and verify user has access
    const domain = await getDomainStatus(domainId);

    // Verify access - user must be in same organization as the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', domain.site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this domain' },
        { status: 403 }
      );
    }

    // Trigger verification check
    const verificationResult = await verifyDomain(domainId);

    // Get updated domain status
    const updatedDomain = await getDomainStatus(domainId);

    // Get verification records from Vercel
    let verificationRecords = null;
    let misconfigured = false;

    try {
      verificationRecords = await getVercelVerificationRecords(domain.domain);
      misconfigured = await isVercelDomainMisconfigured(domain.domain);
    } catch (vercelError) {
      console.error('[POST /api/domains/[id]/verify] Error getting Vercel info:', vercelError);
    }

    return NextResponse.json({
      domain: updatedDomain,
      verificationResult,
      verificationRecords,
      misconfigured,
      instructions: {
        message: 'To verify your domain, add the following CNAME record to your domain provider:',
        recordType: 'CNAME',
        recordName: `_verify.${domain.domain}`,
        recordValue: 'verify.productionhouse.ai',
        notes: [
          'This may take 24-48 hours to propagate across the internet',
          'Once verified, SSL certificate provisioning will begin automatically',
          'You can check this page periodically to see verification progress',
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/domains/[id]/verify] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
