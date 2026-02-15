// Production House — Newsletter History API
// Endpoint to get newsletter send history for a site
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { getNewsletterHistory } from '@/lib/newsletter/sender';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const siteId = request.nextUrl.searchParams.get('siteId');
    const limitParam = request.nextUrl.searchParams.get('limit');

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    // Verify access - user must own the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check if user's organization owns this site
    const { data: userOrg } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userOrg || userOrg.organization_id !== site.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get history
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const history = await getNewsletterHistory(siteId, Math.min(limit, 100));

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error in newsletter history endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
