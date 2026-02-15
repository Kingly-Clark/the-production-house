// Production House — Newsletter Preview API
// Endpoint to preview newsletter HTML without sending
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { buildWeeklyDigest } from '@/lib/newsletter/builder';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { siteId } = await request.json();

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

    // Build the digest
    const digest = await buildWeeklyDigest(siteId);

    if (!digest) {
      return NextResponse.json(
        {
          error: 'No articles found',
          message: 'There are no published articles from the past 7 days to include in the newsletter',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subject: digest.subject,
      html: digest.html,
      articleCount: digest.articleCount,
    });
  } catch (error) {
    console.error('Error in newsletter preview endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
