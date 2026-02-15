import { createAdminClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Import pipeline functions (we'll use dynamic imports with inline implementations)
import { fetchAndProcessSources } from './fetch-pipeline.ts';

interface JobLogInsert {
  job_type: string;
  site_id: string | null;
  status: string;
  articles_fetched: number;
  articles_rewritten: number;
  articles_published: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

async function main() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createAdminClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();

  try {
    // Get all sites with cron_enabled = true and status = 'active'
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, organization_id, articles_per_day')
      .eq('cron_enabled', true)
      .eq('status', 'active');

    if (sitesError) {
      throw new Error(`Error fetching sites: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      console.log('No active sites with cron enabled');

      // Log job completion
      await supabase.from('job_log').insert({
        job_type: 'fetch_sources',
        site_id: null,
        status: 'completed',
        articles_fetched: 0,
        articles_rewritten: 0,
        articles_published: 0,
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({ success: true, sites: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalArticles = 0;
    const errors: string[] = [];

    // Process each site
    for (const site of sites) {
      try {
        const stats = await fetchAndProcessSources(site.id, supabase);
        totalArticles += stats.newArticles;

        if (stats.errors > 0) {
          errors.push(`Site ${site.id}: ${stats.errors} errors`);
        }

        console.log(`Processed site ${site.id}: ${stats.newArticles} new articles`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error processing site ${site.id}: ${errorMsg}`);
        errors.push(`Site ${site.id}: ${errorMsg}`);
      }
    }

    // Log job completion
    const duration = Date.now() - startTime;
    await supabase.from('job_log').insert({
      job_type: 'fetch_sources',
      site_id: null,
      status: 'completed',
      articles_fetched: totalArticles,
      articles_rewritten: 0,
      articles_published: 0,
      error_message: errors.length > 0 ? errors.join('; ') : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sites: sites.length,
        totalArticles,
        errors: errors.length > 0 ? errors : null,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Job failed:', errorMsg);

    // Log job failure
    const duration = Date.now() - startTime;
    await supabase.from('job_log').insert({
      job_type: 'fetch_sources',
      site_id: null,
      status: 'failed',
      articles_fetched: 0,
      articles_rewritten: 0,
      articles_published: 0,
      error_message: errorMsg,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

Deno.serve(main);
