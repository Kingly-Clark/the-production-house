import * as cheerio from 'cheerio';

export interface ScrapedWebsite {
  title: string;
  description: string;
  faviconUrl: string | null;
  logoUrl: string | null;
  brandColors: Record<string, string>;
  ogImageUrl: string | null;
}

async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractColors($: cheerio.CheerioAPI): Record<string, string> {
  const colors: Record<string, string> = {};

  // Extract theme color
  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (themeColor) colors.primary = themeColor;

  // Extract from meta tags
  const msThemeColor = $('meta[name="msapplication-TileColor"]').attr('content');
  if (msThemeColor) colors.secondary = msThemeColor;

  // Extract from CSS variables (inline style tags)
  const styleTag = $('style').first().html();
  if (styleTag) {
    const primaryMatch = styleTag.match(/--primary:\s*([^;]+)/);
    const secondaryMatch = styleTag.match(/--secondary:\s*([^;]+)/);
    const accentMatch = styleTag.match(/--accent:\s*([^;]+)/);

    if (primaryMatch) colors.primary = primaryMatch[1].trim();
    if (secondaryMatch) colors.secondary = secondaryMatch[1].trim();
    if (accentMatch) colors.accent = accentMatch[1].trim();
  }

  return colors;
}

function extractLogo($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Try common logo patterns
  const logoSelectors = [
    'img[alt*="logo" i]',
    'img.logo',
    'img[class*="logo"]',
    'header img:first',
    'nav img:first',
    '.navbar img:first',
  ];

  for (const selector of logoSelectors) {
    const logo = $(selector).first().attr('src');
    if (logo) {
      return resolveUrl(logo, baseUrl);
    }
  }

  return null;
}

function extractFavicon($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ];

  for (const selector of faviconSelectors) {
    const favicon = $(selector).first().attr('href');
    if (favicon) {
      return resolveUrl(favicon, baseUrl);
    }
  }

  // Fallback to common favicon location
  return `${baseUrl}/favicon.ico`;
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

export async function scrapeWebsite(url: string): Promise<ScrapedWebsite> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const baseUrl = parsedUrl.origin;

    // Fetch the page
    const html = await fetchWithTimeout(url);

    // Load with cheerio
    const $ = cheerio.load(html);

    // Extract title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      'Website';

    // Extract description
    let description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';

    // Extract favicon
    const faviconUrl = extractFavicon($, baseUrl);

    // Extract logo
    const logoUrl = extractLogo($, baseUrl);

    // Extract brand colors
    const brandColors = extractColors($);

    // Extract OG image
    const ogImageUrl = $('meta[property="og:image"]').attr('content') || null;

    return {
      title,
      description,
      faviconUrl,
      logoUrl,
      brandColors,
      ogImageUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to scrape website: ${message}`);
  }
}
