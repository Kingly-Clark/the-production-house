import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify access
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (fetchError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get source count
    const { count: sourceCount } = await supabase
      .from('sources')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('is_active', true);

    // Get article counts by status
    const { count: rawCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'raw');

    const { count: pendingCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'pending');

    const { count: publishedCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'published');

    const { count: unpublishedCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'unpublished');

    // Get subscriber count
    const { count: subscriberCount } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('is_confirmed', true);

    return NextResponse.json({
      source_count: sourceCount || 0,
      article_counts: {
        raw: rawCount || 0,
        pending: pendingCount || 0,
        published: publishedCount || 0,
        unpublished: unpublishedCount || 0,
      },
      subscriber_count: subscriberCount || 0,
      published_count: publishedCount || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
