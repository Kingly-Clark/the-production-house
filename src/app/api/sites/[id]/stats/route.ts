import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Verify site exists (use admin client to bypass RLS)
    const { data: site, error: fetchError } = await adminClient
      .from('sites')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (fetchError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get source count
    const { count: sourceCount } = await adminClient
      .from('sources')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('is_active', true);

    // Get article counts by status
    const { count: rawCount } = await adminClient
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'raw');

    const { count: pendingCount } = await adminClient
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'pending');

    const { count: publishedCount } = await adminClient
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'published');

    const { count: unpublishedCount } = await adminClient
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('site_id', id)
      .eq('status', 'unpublished');

    // Get subscriber count
    const { count: subscriberCount } = await adminClient
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
