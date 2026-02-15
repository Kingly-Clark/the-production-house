import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAndProcessSources } from '@/lib/pipeline/fetch';

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
      .select('id, name, status')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check if site has any active sources
    const { data: sources, error: sourcesError } = await adminClient
      .from('sources')
      .select('id')
      .eq('site_id', siteId)
      .eq('is_active', true);

    if (sourcesError) {
      return NextResponse.json(
        { error: 'Failed to check sources' },
        { status: 500 }
      );
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'No active sources found. Add a source first.' },
        { status: 400 }
      );
    }

    // Run the fetch pipeline
    const stats = await fetchAndProcessSources(siteId, adminClient);

    const durationMs = Date.now() - startTime;

    // Log job execution
    await adminClient.from('job_log').insert({
      job_type: 'fetch_sources',
      site_id: siteId,
      status: stats.errors > 0 && stats.newArticles === 0 ? 'failed' : 'completed',
      articles_fetched: stats.newArticles,
      articles_rewritten: 0,
      articles_published: 0,
      error_message: stats.errors > 0 ? `${stats.errors} error(s) during fetch` : null,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    });

    return NextResponse.json({
      success: true,
      stats: {
        sourcesProcessed: sources.length,
        articlesFound: stats.sourced,
        newArticles: stats.newArticles,
        duplicates: stats.duplicates,
        errors: stats.errors,
      },
      durationMs,
    });
  } catch (error) {
    console.error('Error in site fetch:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
