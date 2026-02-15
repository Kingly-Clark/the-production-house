import type { Site, SiteSettings, Article, Category } from '@/types/database';
import ArticleCard from '@/components/site/ArticleCard';
import CategoryFilter from '@/components/site/CategoryFilter';
import Image from 'next/image';
import Link from 'next/link';

interface MagazineTemplateProps {
  site: Site;
  settings: SiteSettings;
  articles: Article[];
  categories: Category[];
  currentCategory?: string;
}

export default function MagazineTemplate({
  site,
  settings,
  articles,
  categories,
  currentCategory,
}: MagazineTemplateProps) {
  const featuredArticle = articles[0];
  const restArticles = articles.slice(1);

  return (
    <main>
      {/* Hero Section with Featured Article */}
      {featuredArticle && (
        <section className="relative h-96 overflow-hidden mb-12">
          {featuredArticle.featured_image_url && (
            <Image
              src={featuredArticle.featured_image_url}
              alt={featuredArticle.title || featuredArticle.original_title}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute inset-0 flex items-end p-8">
            <div className="max-w-2xl">
              <Link href={`/s/${site.slug}/${featuredArticle.slug}`} className="group">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-3 group-hover:text-[var(--accent)] transition-colors line-clamp-3">
                  {featuredArticle.title || featuredArticle.original_title}
                </h2>
              </Link>
              <p className="text-white text-opacity-90 text-sm mb-4">
                {featuredArticle.excerpt || featuredArticle.meta_description}
              </p>
              <div className="flex items-center gap-4 text-white text-sm">
                {featuredArticle.original_author && (
                  <span>{featuredArticle.original_author}</span>
                )}
                {featuredArticle.published_at && (
                  <time>
                    {new Date(featuredArticle.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <CategoryFilter
          categories={categories}
          siteSlug={site.slug}
          currentCategory={currentCategory}
        />
      </div>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {restArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No articles found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restArticles.map((article) => {
              const category = categories.find((c) => c.id === article.category_id);
              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  category={category}
                  slug={site.slug}
                  variant="default"
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
