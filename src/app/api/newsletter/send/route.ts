// Production House — Manual Newsletter Send API
// Endpoint to manually trigger newsletter sending for a site
// Only available to site owner/admin
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { sendWeeklyNewsletter } from '@/lib/newsletter/sender';
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

    // Send the newsletter
    const result = await sendWeeklyNewsletter(siteId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to send newsletter',
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${result.recipientCount} subscribers`,
      recipientCount: result.recipientCount,
      articleCount: result.articleCount,
      loggingId: result.loggingId,
    });
  } catch (error) {
    console.error('Error in newsletter send endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
