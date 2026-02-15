import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!site) {
    return new Response('Site not found', { status: 404 });
  }

  // Get published articles
  const { data: articles = [] } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // Get categories
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', site.id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const siteUrl = `${baseUrl}/s/${site.slug}`;

  // Build sitemap
  const urls = [
    // Home page
    {
      loc: siteUrl,
      lastmod: site.updated_at,
      priority: '1.0',
      changefreq: 'daily',
    },
    // Category pages
    ...(categories ?? []).map((cat) => ({
      loc: `${siteUrl}/category/${cat.slug}`,
      lastmod: cat.created_at,
      priority: '0.8',
      changefreq: 'weekly',
    })),
    // Article pages
    ...(articles ?? []).map((article) => ({
      loc: `${siteUrl}/${article.slug}`,
      lastmod: article.published_at || article.created_at,
      priority: '0.7',
      changefreq: 'monthly',
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${new Date(url.lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
  `
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
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
