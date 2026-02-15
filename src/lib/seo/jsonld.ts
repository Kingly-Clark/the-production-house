import type { Site, Article } from '@/types/database';

export function generateWebsiteSchema(site: Site, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    description: site.description,
    url: `${baseUrl}/s/${site.slug}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/s/${site.slug}?q={search_term_string}`,
      },
    },
  };
}

export function generateArticleSchema(article: Article, site: Site, baseUrl: string) {
  const publishedDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
  const modifiedDate = article.updated_at ? new Date(article.updated_at).toISOString() : publishedDate;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title || article.original_title,
    description: article.excerpt || article.meta_description || '',
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: article.original_author
      ? {
          '@type': 'Person',
          name: article.original_author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: site.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/s/${site.slug}/${article.slug}`,
    },
    articleBody: article.content || '',
    keywords: article.tags?.join(', ') || '',
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
