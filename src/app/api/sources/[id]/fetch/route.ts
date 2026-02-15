import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAndProcessSources } from '@/lib/pipeline/fetch';

export const maxDuration = 300; // 5 minute timeout for API route

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseServer = await createClient();
    const supabaseAdmin = createAdminClient();
    const sourceId = id;

    // Verify user is authenticated and has access to this source
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get source and verify access
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .select('*, sites(organization_id)')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const { data: userOrgs } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userOrgs || userOrgs.organization_id !== (source as any).sites?.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Process the source
    const stats = await fetchAndProcessSources(source.site_id, supabaseAdmin);

    // Update source's last_fetched_at
    await supabaseAdmin
      .from('sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', sourceId);

    // Log job
    await supabaseAdmin.from('job_log').insert({
      job_type: 'fetch_sources',
      site_id: source.site_id,
      status: 'completed',
      articles_fetched: stats.newArticles,
      articles_rewritten: 0,
      articles_published: 0,
      error_message: stats.errors > 0 ? `${stats.errors} errors` : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: 0,
    });

    return NextResponse.json({
      success: true,
      stats: {
        sourced: stats.sourced,
        newArticles: stats.newArticles,
        duplicates: stats.duplicates,
        errors: stats.errors,
      },
    });
  } catch (error) {
    console.error('Error fetching source:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
