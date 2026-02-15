// Production House — Domain Details API Routes
// Get domain status and delete domains
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { getDomainStatus, removeDomain } from '@/lib/domains';
import { removeDomainFromVercel } from '@/lib/domains/vercel';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/domains/[id]
 * Get domain details with current verification and SSL status
 */
export async function GET(
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

    return NextResponse.json(domain);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/domains/[id]] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }
}

/**
 * DELETE /api/domains/[id]
 * Remove a domain from a site and from Vercel
 */
export async function DELETE(
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

    // Remove from Vercel (background operation, don't fail if this errors)
    try {
      await removeDomainFromVercel(domain.domain);
    } catch (vercelError) {
      console.error('[DELETE /api/domains/[id]] Error removing domain from Vercel:', vercelError);
      // Log alert but continue with deletion
      await supabase.from('admin_alerts').insert({
        type: 'domain_issue',
        severity: 'warning',
        message: `Failed to remove domain from Vercel: ${domain.domain}`,
        details: { domainId, error: String(vercelError) },
        site_id: domain.site_id,
      });
    }

    // Remove domain from database
    await removeDomain(domainId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DELETE /api/domains/[id]] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
