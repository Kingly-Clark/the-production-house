import Parser from 'rss-parser';

export interface ParsedArticle {
  title: string;
  url: string;
  content: string;
  author: string | null;
  publishedAt: string | null;
  imageUrl: string | null;
}

const parser = new Parser({
  timeout: 10000,
});

export async function parseRssFeed(feedUrl: string): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles: ParsedArticle[] = [];

    if (!feed.items || feed.items.length === 0) {
      console.warn(`No items found in RSS feed: ${feedUrl}`);
      return articles;
    }

    for (const item of feed.items) {
      try {
        const url = item.link;
        if (!url) {
          console.warn('Item missing link, skipping');
          continue;
        }

        // Extract content from various possible fields
        let content = item.content || item.description || item.summary || '';
        if (!content) {
          console.warn(`No content found for item: ${item.title}`);
          continue;
        }

        // Extract featured image
        let imageUrl: string | null = null;

        // Try media:content first
        if (item.media && Array.isArray(item.media)) {
          for (const media of item.media) {
            if (media.medium === 'image' && media.url) {
              imageUrl = media.url;
              break;
            }
          }
        }

        // Try media:thumbnail
        if (!imageUrl && item.image) {
          imageUrl = item.image.url || item.image;
        }

        // Try enclosure
        if (!imageUrl && item.enclosure && item.enclosure.url) {
          const enclosureType = (item.enclosure as any).type || '';
          if (enclosureType.startsWith('image/')) {
            imageUrl = item.enclosure.url;
          }
        }

        // Try og:image from content HTML
        if (!imageUrl && content) {
          const ogImageMatch = content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
          if (ogImageMatch) {
            imageUrl = ogImageMatch[1];
          }
        }

        // Try first <img> tag from content
        if (!imageUrl && content) {
          const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }

        articles.push({
          title: item.title || 'Untitled',
          url,
          content,
          author: item.author || item.creator || null,
          publishedAt: item.pubDate || item.isoDate || null,
          imageUrl,
        });
      } catch (itemError) {
        console.error(`Error processing RSS item: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
        continue;
      }
    }

    return articles;
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
