import type { Metadata } from 'next';
import type { Site, SiteSettings, Article } from '@/types/database';

export function generateSiteMeta(site: Site, settings: SiteSettings): Metadata {
  const title = settings.meta_title || site.name;
  const description = settings.meta_description || site.description || '';
  const ogImage = settings.og_image_url || settings.logo_url;

  return {
    title,
    description,
    keywords: [site.name, 'content', 'articles'],
    authors: [{ name: site.name }],
    creator: 'Production House',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `/s/${site.slug}`,
      title,
      description,
      siteName: site.name,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateArticleMeta(
  article: Article,
  site: Site,
  settings: SiteSettings
): Metadata {
  const title = article.title || article.original_title;
  const description = article.meta_description || article.excerpt || '';
  const image = article.featured_image_url || settings.og_image_url;
  const publishedDate = article.published_at ? new Date(article.published_at) : undefined;

  return {
    title: `${title} — ${site.name}`,
    description,
    keywords: [...(article.tags || []), site.name],
    authors: article.original_author ? [{ name: article.original_author }] : undefined,
    creator: article.original_author || site.name,
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: `/s/${site.slug}/${article.slug}`,
      title,
      description,
      siteName: site.name,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
      publishedTime: publishedDate?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
