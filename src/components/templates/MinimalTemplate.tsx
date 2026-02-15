import type { Site, SiteSettings, Article, Category } from '@/types/database';
import Link from 'next/link';
import NewsletterSignup from '@/components/site/NewsletterSignup';

interface MinimalTemplateProps {
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

export default function MinimalTemplate({
  site,
  settings,
  articles,
  categories,
  currentCategory,
}: MinimalTemplateProps) {
  return (
    <main className="flex justify-center px-4 py-12 md:py-16">
      <article className="w-full max-w-2xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-[var(--text)] mb-4 leading-tight">
            {site.name}
          </h1>
          {site.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {site.description}
            </p>
          )}
        </header>

        {/* Articles List */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No articles found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-12 mb-16">
            {articles.map((article) => {
              const publishedDate = article.published_at
                ? new Date(article.published_at)
                : null;
              const readTime = calculateReadTime(article.content);

              return (
                <article key={article.id} className="border-b border-gray-200 dark:border-gray-800 pb-12 last:border-b-0 last:pb-0">
                  <Link href={`/s/${site.slug}/${article.slug}`} className="group">
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text)] mb-3 group-hover:text-[var(--accent)] transition-colors leading-tight">
                      {article.title || article.original_title}
                    </h2>
                  </Link>

                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {publishedDate && (
                      <time>
                        {publishedDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                    <span>•</span>
                    <span>{readTime} min read</span>
                    {article.original_author && (
                      <>
                        <span>•</span>
                        <span>{article.original_author}</span>
                      </>
                    )}
                  </div>

                  {article.excerpt && (
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {article.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/s/${site.slug}/${article.slug}`}
                    className="inline-block text-[var(--accent)] font-medium hover:underline text-sm"
                  >
                    Read more →
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Newsletter Section */}
        <section className="border-t border-gray-200 dark:border-gray-800 pt-12">
          <h3 className="text-2xl font-bold text-[var(--text)] mb-4">Subscribe to {site.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get the latest articles delivered straight to your inbox. No spam, ever.
          </p>
          <NewsletterSignup siteSlug={site.slug} fullWidth placeholderText="your@email.com" />
        </section>
      </article>
    </main>
  );
}
