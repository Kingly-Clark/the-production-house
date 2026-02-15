'use client';

import type { Site, SiteSettings, Article, Category } from '@/types/database';
import ArticleCard from '@/components/site/ArticleCard';
import { useState } from 'react';

interface TechTemplateProps {
  site: Site;
  settings: SiteSettings;
  articles: Article[];
  categories: Category[];
  currentCategory?: string;
}

function calculateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default function TechTemplate({
  site,
  settings,
  articles,
  categories,
  currentCategory,
}: TechTemplateProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(currentCategory || null);

  // Collect all unique tags from articles
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags || []))).sort();

  // Filter articles based on selected tag
  const filteredArticles = selectedTag
    ? articles.filter((a) => a.tags?.includes(selectedTag))
    : articles;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <header className="mb-12">
        <h1 className="text-5xl md:text-6xl font-black text-[var(--text)] mb-4 font-mono">
          {site.name}
        </h1>
        {site.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            {site.description}
          </p>
        )}

        {/* Search/Filter Bar */}
        <div className="flex gap-2 items-center mb-8">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Filter:
          </span>
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                selectedTag === null
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedTag(category.slug)}
                className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                  selectedTag === category.slug
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No articles found. Try a different filter!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredArticles.map((article) => {
            const category = categories.find((c) => c.id === article.category_id);
            const readTime = calculateReadTime(article.content);

            return (
              <div
                key={article.id}
                className="group border border-gray-200 dark:border-gray-800 rounded-lg hover:border-[var(--accent)] transition-colors overflow-hidden hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]"
              >
                {/* Card Header with Image */}
                {article.featured_image_url && (
                  <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                      src={article.featured_image_url}
                      alt={article.title || article.original_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Card Body */}
                <div className="p-5">
                  {/* Category Tag */}
                  {category && (
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 text-xs font-mono font-bold rounded bg-[var(--accent)] bg-opacity-10 text-[var(--accent)]">
                        {category.name}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <a
                    href={`/s/${site.slug}/${article.slug}`}
                    className="group/link block mb-2"
                  >
                    <h3 className="text-lg font-bold font-mono text-[var(--text)] group-hover/link:text-[var(--accent)] transition-colors line-clamp-2">
                      {article.title || article.original_title}
                    </h3>
                  </a>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
                    <span>{readTime} min read</span>
                    {article.published_at && (
                      <time>
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Tags Cloud */}
      {allTags.length > 0 && (
        <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 font-mono">
            All Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const count = articles.filter((a) => a.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                    selectedTag === tag
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  {tag} <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
