import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Article } from '@/types/database';
import { parseRssFeed } from './parse-rss';
import { parseSitemap } from './parse-sitemap';
import { computeSimHash } from './simhash';
import crypto from 'crypto';

interface FetchStats {
  sourced: number;
  newArticles: number;
  duplicates: number;
  errors: number;
}

function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function fetchAndProcessSources(
  siteId: string,
  supabase: SupabaseClient<Database>
): Promise<FetchStats> {
  const stats: FetchStats = {
    sourced: 0,
    newArticles: 0,
    duplicates: 0,
    errors: 0,
  };

  try {
    // Get all active sources for this site
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      stats.errors++;
      return stats;
    }

    if (!sources || sources.length === 0) {
      console.log(`No active sources found for site ${siteId}`);
      return stats;
    }

    // Process each source
    for (const source of sources) {
      try {
        let articles;

        if (source.source_type === 'rss') {
          articles = await parseRssFeed(source.url);
        } else if (source.source_type === 'sitemap') {
          const sitemapUrls = await parseSitemap(source.url);
          // Convert sitemap URLs to articles
          articles = sitemapUrls.map((item) => ({
            title: item.url.split('/').pop() || item.url,
            url: item.url,
            content: '',
            author: null,
            publishedAt: item.lastmod || null,
            imageUrl: null,
          }));
        } else {
          console.warn(`Unknown source type: ${source.source_type}`);
          stats.errors++;
          continue;
        }

        stats.sourced += articles.length;

        // Check each article for duplicates and insert if new
        for (const article of articles) {
          try {
            // Check if URL already exists
            const { data: existingByUrl } = await supabase
              .from('articles')
              .select('id')
              .eq('site_id', siteId)
              .eq('original_url', article.url)
              .limit(1);

            if (existingByUrl && existingByUrl.length > 0) {
              stats.duplicates++;
              continue;
            }

            // Compute content hash
            const contentHash = generateContentHash(article.content || article.title);

            // Insert new article
            const { error: insertError } = await supabase.from('articles').insert({
              site_id: siteId,
              source_id: source.id,
              original_title: article.title,
              original_url: article.url,
              original_content: article.content || null,
              original_author: article.author || null,
              original_published_at: article.publishedAt || null,
              status: 'raw',
              content_hash: contentHash,
              tags: [],
              social_hashtags: [],
              view_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error(`Error inserting article: ${insertError.message}`);
              stats.errors++;
            } else {
              stats.newArticles++;
            }
          } catch (articleError) {
            console.error(
              `Error processing article ${article.url}: ${articleError instanceof Error ? articleError.message : String(articleError)}`
            );
            stats.errors++;
          }
        }

        // Update source stats
        await supabase
          .from('sources')
          .update({
            last_fetched_at: new Date().toISOString(),
            article_count: (source.article_count || 0) + articles.length,
            last_error: null,
          })
          .eq('id', source.id);
      } catch (sourceError) {
        console.error(
          `Error processing source ${source.url}: ${sourceError instanceof Error ? sourceError.message : String(sourceError)}`
        );
        stats.errors++;

        // Update source with error
        await supabase
          .from('sources')
          .update({
            last_error: sourceError instanceof Error ? sourceError.message : String(sourceError),
            last_fetched_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      }
    }
  } catch (error) {
    console.error(
      `Error in fetchAndProcessSources: ${error instanceof Error ? error.message : String(error)}`
    );
    stats.errors++;
  }

  return stats;
}
