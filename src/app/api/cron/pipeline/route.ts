import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAndProcessSources } from '@/lib/pipeline/fetch';
import { rewriteRawArticles } from '@/lib/pipeline/rewrite';

export const maxDuration = 300; // 5 minute timeout for Vercel Pro
export const dynamic = 'force-dynamic';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If no CRON_SECRET is set, allow requests (for development)
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing request');
    return true;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify the request is from Vercel Cron
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    
    // Get all active sites with cron enabled
    const { data: sites, error: sitesError } = await adminClient
      .from('sites')
      .select('id, name, articles_per_day')
      .eq('cron_enabled', true)
      .eq('status', 'active');

    if (sitesError) {
      throw new Error(`Error fetching sites: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active sites with cron enabled',
        sites: 0,
      });
    }

    const results = {
      sitesProcessed: sites.length,
      totalFetched: 0,
      totalRewritten: 0,
      errors: [] as string[],
    };

    // Process each site
    for (const site of sites) {
      try {
        // Step 1: Fetch new articles from sources
        const fetchStats = await fetchAndProcessSources(site.id, adminClient);
        results.totalFetched += fetchStats.newArticles;

        console.log(`[${site.name}] Fetched ${fetchStats.newArticles} new articles`);

        // Step 2: Rewrite raw articles (limit to articles_per_day)
        const rewriteStats = await rewriteRawArticles(
          site.id,
          adminClient,
          site.articles_per_day || 5
        );
        results.totalRewritten += rewriteStats.published;

        console.log(`[${site.name}] Rewritten ${rewriteStats.published} articles`);

        // Log job execution
        await adminClient.from('job_log').insert({
          job_type: 'cron_pipeline',
          site_id: site.id,
          status: 'completed',
          articles_fetched: fetchStats.newArticles,
          articles_rewritten: rewriteStats.published,
          articles_published: rewriteStats.published,
          error_message: null,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error processing site ${site.name}:`, errorMsg);
        results.errors.push(`${site.name}: ${errorMsg}`);

        // Log job failure
        await adminClient.from('job_log').insert({
          job_type: 'cron_pipeline',
          site_id: site.id,
          status: 'failed',
          articles_fetched: 0,
          articles_rewritten: 0,
          articles_published: 0,
          error_message: errorMsg,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      results,
      durationMs,
    });
  } catch (error) {
    console.error('Cron pipeline error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
