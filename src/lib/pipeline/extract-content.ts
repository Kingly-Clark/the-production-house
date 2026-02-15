import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  content: string;
  author: string | null;
  publishedDate: string | null;
  featuredImage: string | null;
}

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

function extractFeaturedImage($: cheerio.CheerioAPI, html: string): string | null {
  // Try og:image meta tag first
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    return ogImage;
  }

  // Try twitter:image
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage) {
    return twitterImage;
  }

  // Try finding first large image in content
  const images = $('article img, .post-content img, .entry-content img, main img, [role="main"] img');
  if (images.length > 0) {
    const src = images.first().attr('src');
    if (src) {
      return src;
    }
  }

  // Generic first image
  const firstImg = $('img').first().attr('src');
  return firstImg || null;
}

function extractAuthor($: cheerio.CheerioAPI): string | null {
  // Try meta author tag
  let author = $('meta[name="author"]').attr('content');
  if (author) {
    return author;
  }

  // Try article author selectors
  author = $('.author-name').text().trim();
  if (author) {
    return author;
  }

  author = $('.by-author').text().trim();
  if (author) {
    return author;
  }

  author = $('[rel="author"]').text().trim();
  if (author) {
    return author;
  }

  // Try byline patterns
  const byline = $('.byline').text().trim();
  if (byline) {
    const match = byline.match(/by\s+([^,\n]+)/i);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function extractPublishedDate($: cheerio.CheerioAPI): string | null {
  // Try meta published date
  let date = $('meta[property="article:published_time"]').attr('content');
  if (date) {
    return date;
  }

  date = $('meta[name="publish_date"]').attr('content');
  if (date) {
    return date;
  }

  // Try time elements
  const timeElement = $('article time, .post-date time, time[datetime]').first();
  if (timeElement.length > 0) {
    const datetime = timeElement.attr('datetime');
    if (datetime) {
      return datetime;
    }
  }

  return null;
}

function extractArticleBody($: cheerio.CheerioAPI): string {
  // Remove script, style, nav, footer, sidebar elements
  $('script, style, nav, footer, noscript, .navigation, .sidebar, aside').remove();

  // Remove common ad/tracking elements
  $('[class*="ad"], [id*="ad"], .advertisement, .banner, .popup').remove();

  // Try common article selectors in order of preference
  const selectors = [
    'article',
    '[role="main"]',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.content-main',
    'main',
    '.main-content',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const content = element.html();
      if (content && content.trim().length > 200) {
        return content;
      }
    }
  }

  // Fallback: get body content
  return $('body').html() || '';
}

function cleanHtml(html: string): string {
  // Remove scripts and styles
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove iframes
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove event handlers
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  return cleaned.trim();
}

export async function extractArticleContent(url: string): Promise<ExtractedContent> {
  try {
    const html = await fetchWithTimeout(url, 10000);
    const $ = cheerio.load(html);

    // Extract title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text() ||
      $('title').text() ||
      'Untitled';

    title = title.trim();

    // Extract author
    const author = extractAuthor($);

    // Extract published date
    const publishedDate = extractPublishedDate($);

    // Extract featured image
    const featuredImage = extractFeaturedImage($, html);

    // Extract article content
    let content = extractArticleBody($);
    content = cleanHtml(content);

    return {
      title,
      content,
      author,
      publishedDate,
      featuredImage,
    };
  } catch (error) {
    console.error(`Error extracting content from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
