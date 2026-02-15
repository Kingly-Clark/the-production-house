import { createAdminClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Simple rewrite pipeline for edge function
interface RewriteStats {
  processed: number;
  published: number;
  filtered: number;
  duplicates: number;
  errors: number;
}

async function extractArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductionHouse/1.0)',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    // Extract text content - simple approach for edge function
    const textContent = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return textContent.substring(0, 5000);
  } catch (error) {
    console.error(`Error extracting content: ${error}`);
    return '';
  }
}

function checkSalesContent(title: string, content: string): boolean {
  const salesKeywords = [
    'buy now',
    'limited time',
    'discount',
    'promo',
    'sale',
    'coupon',
    'deal',
    'special price',
    'free shipping',
    'order now',
  ];

  const text = (title + ' ' + content).toLowerCase();

  for (const keyword of salesKeywords) {
    if (text.includes(keyword)) {
      return true;
    }
  }

  // Check for excessive uppercase
  const words = text.split(/\s+/);
  let uppercaseCount = 0;
  for (const word of words) {
    const letters = word.replace(/[^a-z]/gi, '');
    if (letters.length > 0 && letters === letters.toUpperCase()) {
      uppercaseCount++;
    }
  }

  if (words.length > 0 && uppercaseCount / words.length > 0.3) {
    return true;
  }

  return false;
}

async function rewriteArticleContent(
  title: string,
  content: string,
  tone: string,
  brandSummary: string | null
): Promise<{
  title: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
}> {
  // For edge function, provide a basic rewrite structure
  // In production, this would call Gemini API

  // Generate excerpt from content
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const excerpt =
    sentences.slice(0, 3).join('. ').substring(0, 200) +
    (sentences.length > 3 ? '...' : '');

  // Generate meta description
  const metaDescription = excerpt.substring(0, 160);

  // Generate basic tags from title
  const tags = title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 7);

  return {
    title: title.length > 60 ? title.substring(0, 57) + '...' : title,
    excerpt,
    metaDescription,
    tags,
  };
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
    // Get all sites with raw articles
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, tone_of_voice, articles_per_day')
      .eq('status', 'active');

    if (sitesError) {
      throw new Error(`Error fetching sites: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      return new Response(JSON.stringify({ success: true, sitesProcessed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalPublished = 0;
    let totalFiltered = 0;
    let totalErrors = 0;

    // Process each site
    for (const site of sites) {
      try {
        // Get raw articles for this site
        const { data: rawArticles } = await supabase
          .from('articles')
          .select('*')
          .eq('site_id', site.id)
          .eq('status', 'raw')
          .limit(site.articles_per_day || 10);

        if (!rawArticles || rawArticles.length === 0) {
          continue;
        }

        // Get organization brand summary
        const { data: siteData } = await supabase.from('sites').select('organization_id').eq('id', site.id).single();

        const { data: org } = siteData
          ? await supabase
              .from('organizations')
              .select('brand_summary')
              .eq('id', siteData.organization_id)
              .single()
          : { data: null };

        const brandSummary = org?.brand_summary || null;

        // Process articles
        for (const article of rawArticles) {
          try {
            // Extract content if needed
            let extractedContent = article.original_content;
            if (!extractedContent && article.original_url) {
              extractedContent = await extractArticleContent(article.original_url);
            }

            // Check for sales content
            if (checkSalesContent(article.original_title, extractedContent || '')) {
              await supabase.from('articles').update({ status: 'filtered' }).eq('id', article.id);
              totalFiltered++;
              continue;
            }

            // Rewrite content
            const rewritten = await rewriteArticleContent(
              article.original_title,
              extractedContent || '',
              site.tone_of_voice,
              brandSummary
            );

            // Generate slug
            const slug = rewritten.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');

            // Update article
            const { error: updateError } = await supabase.from('articles').update({
              title: rewritten.title,
              slug,
              excerpt: rewritten.excerpt,
              meta_description: rewritten.metaDescription,
              tags: rewritten.tags,
              status: 'published',
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (!updateError) {
              totalPublished++;
            } else {
              totalErrors++;
            }
          } catch (error) {
            console.error(`Error processing article: ${error}`);
            totalErrors++;

            await supabase.from('articles').update({ status: 'failed' }).eq('id', article.id);
          }
        }
      } catch (error) {
        console.error(`Error processing site ${site.id}: ${error}`);
        totalErrors++;
      }
    }

    // Log job completion
    const duration = Date.now() - startTime;
    await supabase.from('job_log').insert({
      job_type: 'rewrite_articles',
      site_id: null,
      status: 'completed',
      articles_fetched: 0,
      articles_rewritten: totalPublished,
      articles_published: totalPublished,
      error_message: totalErrors > 0 ? `${totalErrors} errors during processing` : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        published: totalPublished,
        filtered: totalFiltered,
        errors: totalErrors,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Job failed:', errorMsg);

    const duration = Date.now() - startTime;
    await supabase.from('job_log').insert({
      job_type: 'rewrite_articles',
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
