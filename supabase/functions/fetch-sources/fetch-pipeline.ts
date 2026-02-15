// Deno-compatible fetch pipeline for edge functions
// Note: Uses standard fetch API and Deno runtime

interface FetchStats {
  sourced: number;
  newArticles: number;
  duplicates: number;
  errors: number;
}

async function parseRssFeed(feedUrl: string): Promise<any[]> {
  try {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();

    // Simple XML parsing - extract URLs and titles
    const items: any[] = [];

    // Extract item blocks
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/gi) || [];

    for (const itemText of itemMatches) {
      const titleMatch = itemText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = itemText.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const descMatch = itemText.match(/<description[^>]*>([\s\S]*?)<\/description>/i);

      if (linkMatch) {
        items.push({
          title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Untitled',
          url: linkMatch[1].trim(),
          content: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : '',
          author: null,
          publishedAt: null,
          imageUrl: null,
        });
      }
    }

    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    throw error;
  }
}

async function parseSitemap(sitemapUrl: string): Promise<any[]> {
  try {
    const response = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();

    // Check if sitemap index
    if (text.includes('<sitemapindex')) {
      const sitemapMatches = text.match(/<loc>(https?:\/\/[^<]+)<\/loc>/gi) || [];
      const allUrls: any[] = [];

      for (const match of sitemapMatches) {
        const url = match.replace(/<loc>|<\/loc>/gi, '');
        try {
          const childUrls = await parseSitemap(url);
          allUrls.push(...childUrls);
        } catch (error) {
          console.error(`Error parsing child sitemap: ${error}`);
        }
      }

      return allUrls;
    }

    // Regular sitemap
    const urls: any[] = [];
    const urlMatches = text.match(/<url>([\s\S]*?)<\/url>/gi) || [];

    for (const urlBlock of urlMatches) {
      const locMatch = urlBlock.match(/<loc>(https?:\/\/[^<]+)<\/loc>/);
      if (locMatch) {
        urls.push({
          url: locMatch[1],
          lastmod: null,
          priority: null,
        });
      }
    }

    return urls;
  } catch (error) {
    console.error(`Error parsing sitemap ${sitemapUrl}:`, error);
    throw error;
  }
}

function hashContent(content: string): string {
  // Simple hash using built-in crypto
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  // Use crypto.subtle for hashing in Deno
  return Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

export async function fetchAndProcessSources(siteId: string, supabase: any): Promise<FetchStats> {
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
          articles = sitemapUrls.map((item: any) => ({
            title: item.url.split('/').pop() || item.url,
            url: item.url,
            content: '',
            author: null,
            publishedAt: item.lastmod || null,
            imageUrl: null,
          }));
        } else {
          stats.errors++;
          continue;
        }

        stats.sourced += articles.length;

        // Check each article for duplicates
        for (const article of articles) {
          try {
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

            // Insert new article
            const contentHash = hashContent(article.content || article.title);

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

            if (!insertError) {
              stats.newArticles++;
            } else {
              stats.errors++;
            }
          } catch (articleError) {
            console.error(`Error processing article: ${articleError}`);
            stats.errors++;
          }
        }

        // Update source stats
        await supabase
          .from('sources')
          .update({
            last_fetched_at: new Date().toISOString(),
            article_count: (source.article_count || 0) + articles.length,
          })
          .eq('id', source.id);
      } catch (sourceError) {
        console.error(`Error processing source: ${sourceError}`);
        stats.errors++;

        await supabase
          .from('sources')
          .update({
            last_error: String(sourceError),
            last_fetched_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      }
    }
  } catch (error) {
    console.error(`Error in fetchAndProcessSources: ${error}`);
    stats.errors++;
  }

  return stats;
}
