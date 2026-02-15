// Production House — Domain Management API Routes
// Handles listing and creating custom domains
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { addCustomDomain } from '@/lib/domains';
import { addDomainToVercel } from '@/lib/domains/vercel';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/domains?siteId=...
 * List all domains for a site
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify access - user must be in same organization as the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this site' },
        { status: 403 }
      );
    }

    // Fetch domains
    const { data: domains, error } = await supabase
      .from('site_domains')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(domains || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/domains] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domains
 * Add a new custom domain to a site
 * Body: { siteId: string, domain: string, domainType?: 'custom' | 'subdomain' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { siteId, domain, domainType = 'custom' } = body;

    // Validate input
    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    if (!['custom', 'subdomain'].includes(domainType)) {
      return NextResponse.json(
        { error: 'domainType must be "custom" or "subdomain"' },
        { status: 400 }
      );
    }

    // Verify access - user must be in same organization as the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this site' },
        { status: 403 }
      );
    }

    // Add domain via domain management library
    const siteDomain = await addCustomDomain(siteId, domain, domainType);

    // Add domain to Vercel project (background operation, don't fail if this errors)
    try {
      await addDomainToVercel(siteDomain.domain);
    } catch (vercelError) {
      console.error('[POST /api/domains] Error adding domain to Vercel:', vercelError);
      // Log alert but don't fail the request
      await supabase.from('admin_alerts').insert({
        type: 'domain_issue',
        severity: 'warning',
        message: `Failed to add domain to Vercel: ${siteDomain.domain}`,
        details: { domainId: siteDomain.id, error: String(vercelError) },
        site_id: siteId,
      });
    }

    return NextResponse.json(siteDomain, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/domains] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
