'use client';

import type { Article, Site, Category } from '@/types/database';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface ArticleFullProps {
  article: Article;
  site: Site;
  category?: Category;
}

function calculateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default function ArticleFull({ article, site, category }: ArticleFullProps) {
  const readTime = calculateReadTime(article.content);
  const publishedDate = article.published_at ? new Date(article.published_at) : null;

  // Build share URL from the current page URL (works in client components)
  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_APP_URL || ''}/s/${site.slug}/${article.slug}`;
  const shareTitle = article.title || article.original_title;

  return (
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        {category && (
          <div className="mb-3">
            <Link
              href={`/s/${site.slug}/category/${category.slug}`}
              className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {category.name}
            </Link>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
          {shareTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-4">
          {article.original_author && (
            <div className="flex items-center gap-2">
              <span className="font-medium">{article.original_author}</span>
            </div>
          )}

          {publishedDate && (
            <time dateTime={publishedDate.toISOString()}>
              {format(publishedDate, 'MMMM d, yyyy')}
            </time>
          )}

          <span className="inline-block">
            {readTime} {readTime === 1 ? 'min' : 'mins'} read
          </span>

          <span className="ml-auto">{article.view_count} views</span>
        </div>
      </header>

      {/* Featured Image */}
      {(article.featured_image_stored || article.featured_image_url) && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          <Image
            src={article.featured_image_stored || article.featured_image_url!}
            alt={shareTitle}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      )}

      {/* Content */}
      {article.content && (
        <div
          className="article-content mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200 dark:border-gray-800">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Share Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-300 mb-3">
          Share this article:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
          >
            X (Twitter)
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-[#0A66C2] text-white rounded-lg hover:bg-[#0958A8] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </article>
  );
}
