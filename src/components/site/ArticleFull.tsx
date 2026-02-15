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

  return (
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        {category && (
          <div className="mb-3">
            <Link
              href={`/s/${site.slug}/category/${category.slug}`}
              className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] hover:bg-opacity-20 transition-colors"
            >
              {category.name}
            </Link>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
          {article.title || article.original_title}
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
      {article.featured_image_url && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          <Image
            src={article.featured_image_url}
            alt={article.title || article.original_title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content - Note: Content is sanitized server-side before storage */}
      {article.content && (
        <div
          className="prose prose-invert max-w-none mb-8
            dark:prose-invert prose-headings:text-[var(--text)] prose-headings:font-bold
            prose-p:text-[var(--text)] prose-p:leading-relaxed
            prose-a:text-[var(--accent)] prose-a:hover:underline
            prose-strong:text-[var(--text)] prose-strong:font-semibold
            prose-code:text-[var(--accent)] prose-code:bg-gray-100 dark:prose-code:bg-gray-900
            prose-pre:bg-gray-900 dark:prose-pre:bg-black
            prose-blockquote:border-l-[var(--accent)] prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
            prose-img:rounded-lg
            [&_a]:no-underline [&_a]:font-medium [&_a]:text-[var(--accent)]
            [&_a]:hover:underline
          "
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
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Share this article:
        </p>
        <div className="flex gap-3">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              `${process.env.NEXT_PUBLIC_APP_URL}/s/${site.slug}/${article.slug}`
            )}&text=${encodeURIComponent(article.title || article.original_title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] rounded-lg hover:bg-opacity-20 transition-colors"
          >
            X (Twitter)
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              `${process.env.NEXT_PUBLIC_APP_URL}/s/${site.slug}/${article.slug}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] rounded-lg hover:bg-opacity-20 transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              `${process.env.NEXT_PUBLIC_APP_URL}/s/${site.slug}/${article.slug}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] rounded-lg hover:bg-opacity-20 transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </article>
  );
}
