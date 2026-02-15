import type { Article, Category } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  category?: Category;
  slug: string;
  variant?: 'default' | 'horizontal' | 'compact';
}

function calculateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default function ArticleCard({
  article,
  category,
  slug,
  variant = 'default',
}: ArticleCardProps) {
  const readTime = calculateReadTime(article.content);
  const publishedDate = article.published_at ? new Date(article.published_at) : null;
  const articleUrl = `/s/${slug}/${article.slug}`;
  // Prefer stored image (Supabase), fallback to original URL
  const imageUrl = article.featured_image_stored || article.featured_image_url;

  if (variant === 'compact') {
    return (
      <article className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
        <Link href={articleUrl} className="group">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {article.title || article.original_title}
          </h3>
        </Link>
        {publishedDate && (
          <time className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            {publishedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </time>
        )}
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className="flex gap-4 group">
        {imageUrl && (
          <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
            <Image
              src={imageUrl}
              alt={article.title || article.original_title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={articleUrl} className="group/link">
            <h3 className="font-semibold text-base group-hover/link:text-[var(--accent)] transition-colors line-clamp-2">
              {article.title || article.original_title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {article.excerpt || article.meta_description || ''}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {publishedDate && (
              <time>
                {publishedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            )}
            <span>{readTime} min read</span>
          </div>
        </div>
      </article>
    );
  }

  // Default variant
  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 hover:border-[var(--accent)] transition-colors">
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <Image
            src={imageUrl}
            alt={article.title || article.original_title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
      )}
      <div className="p-4">
        {category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-[var(--accent)] bg-opacity-10 text-[var(--accent)]">
              {category.name}
            </span>
          </div>
        )}
        <Link href={articleUrl} className="group/link">
          <h3 className="font-semibold text-base group-hover/link:text-[var(--accent)] transition-colors line-clamp-2">
            {article.title || article.original_title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
          {article.excerpt || article.meta_description || ''}
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          {publishedDate && (
            <time>
              {publishedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          )}
          {article.original_author && <span>{article.original_author}</span>}
          <span>{readTime} min read</span>
        </div>
      </div>
    </article>
  );
}
