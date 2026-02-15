import { XMLParser } from 'fast-xml-parser';

export interface SitemapUrl {
  url: string;
  lastmod: string | null;
  priority: number | null;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductionHouse/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function parseSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
  try {
    const sitemapContent = await fetchWithTimeout(sitemapUrl, 10000);
    const parsed = xmlParser.parse(sitemapContent);

    // Check if this is a sitemap index
    if (parsed.sitemapindex) {
      return await parseSitemapIndex(parsed.sitemapindex, sitemapUrl);
    }

    // Regular sitemap
    if (parsed.urlset) {
      return parseSitemapUrls(parsed.urlset);
    }

    console.warn(`Invalid sitemap structure at ${sitemapUrl}`);
    return [];
  } catch (error) {
    console.error(`Error parsing sitemap ${sitemapUrl}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function parseSitemapIndex(sitemapindex: any, baseUrl: string): Promise<SitemapUrl[]> {
  const sitemaps = Array.isArray(sitemapindex.sitemap) ? sitemapindex.sitemap : [sitemapindex.sitemap];
  const allUrls: SitemapUrl[] = [];

  for (const sitemap of sitemaps) {
    try {
      const sitemapUrl = sitemap.loc;
      if (!sitemapUrl) {
        continue;
      }

      const urls = await parseSitemap(sitemapUrl);
      allUrls.push(...urls);
    } catch (error) {
      console.error(`Error parsing sitemap from index: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
  }

  return allUrls;
}

function parseSitemapUrls(urlset: any): SitemapUrl[] {
  const urls = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
  const result: SitemapUrl[] = [];

  for (const urlEntry of urls) {
    try {
      if (!urlEntry || !urlEntry.loc) {
        continue;
      }

      result.push({
        url: urlEntry.loc,
        lastmod: urlEntry.lastmod || null,
        priority: urlEntry.priority ? parseFloat(urlEntry.priority) : null,
      });
    } catch (error) {
      console.error(`Error processing sitemap URL entry: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
  }

  return result;
}
