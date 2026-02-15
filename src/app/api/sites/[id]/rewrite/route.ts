import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rewriteRawArticles } from '@/lib/pipeline/rewrite';

export const maxDuration = 300; // 5 minute timeout

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id: siteId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify site exists
    const { data: site, error: siteError } = await adminClient
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check for raw articles
    const { count } = await adminClient
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .in('status', ['raw', 'failed', 'filtered']);

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'No articles to rewrite. Fetch sources first.' },
        { status: 400 }
      );
    }

    // Parse optional limit from body
    let limit: number | undefined;
    try {
      const body = await request.json();
      limit = body?.limit;
    } catch {
      // No body, use default
    }

    // Run the rewrite pipeline
    const stats = await rewriteRawArticles(siteId, adminClient, limit);

    const durationMs = Date.now() - startTime;

    // Log job execution
    await adminClient.from('job_log').insert({
      job_type: 'rewrite_articles',
      site_id: siteId,
      status: stats.errors > 0 && stats.published === 0 ? 'failed' : 'completed',
      articles_fetched: 0,
      articles_rewritten: stats.published,
      articles_published: stats.published,
      error_message: stats.errors > 0 ? `${stats.errors} error(s) during rewrite` : null,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    });

    return NextResponse.json({
      success: true,
      stats: {
        processed: stats.processed,
        published: stats.published,
        filtered: stats.filtered,
        duplicates: stats.duplicates,
        errors: stats.errors,
      },
      durationMs,
    });
  } catch (error) {
    console.error('Error in site rewrite:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
