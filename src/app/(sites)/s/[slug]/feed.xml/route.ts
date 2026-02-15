import { createAdminClient } from '@/lib/supabase/admin';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!site) {
    return new Response('Site not found', { status: 404 });
  }

  // Get site settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('site_id', site.id)
    .single();

  // Get last 20 published articles
  const { data: articles = [] } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const siteUrl = `${baseUrl}/s/${site.slug}`;

  // Build RSS feed
  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <description>${escapeXml(site.description || '')}</description>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${(articles ?? [])
      .map(
        (article) => `
    <item>
      <title>${escapeXml(article.title || article.original_title)}</title>
      <description>${escapeXml(article.excerpt || article.meta_description || '')}</description>
      <link>${escapeXml(`${siteUrl}/${article.slug}`)}</link>
      <guid isPermaLink="false">${escapeXml(article.id)}</guid>
      ${article.published_at ? `<pubDate>${new Date(article.published_at).toUTCString()}</pubDate>` : ''}
      ${article.original_author ? `<author>${escapeXml(article.original_author)}</author>` : ''}
      ${(article.featured_image_stored || article.featured_image_url) ? `<image><url>${escapeXml((article.featured_image_stored || article.featured_image_url)!)}</url><title>${escapeXml(article.title || article.original_title)}</title><link>${escapeXml(siteUrl)}</link></image>` : ''}
      <content:encoded><![CDATA[${article.content || ''}]]></content:encoded>
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
