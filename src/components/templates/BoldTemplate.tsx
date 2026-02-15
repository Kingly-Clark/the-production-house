import type { Site, SiteSettings, Article, Category } from '@/types/database';
import Image from 'next/image';
import Link from 'next/link';
import ArticleCard from '@/components/site/ArticleCard';
import CategoryFilter from '@/components/site/CategoryFilter';

interface BoldTemplateProps {
  site: Site;
  settings: SiteSettings;
  articles: Article[];
  categories: Category[];
  currentCategory?: string;
}

export default function BoldTemplate({
  site,
  settings,
  articles,
  categories,
  currentCategory,
}: BoldTemplateProps) {
  const featuredArticles = articles.slice(0, 3);
  const restArticles = articles.slice(3);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-7xl font-black text-[var(--text)] mb-6 leading-tight">
            {site.name}
          </h1>
          {site.description && (
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl">
              {site.description}
            </p>
          )}
        </div>
      </section>

      {/* Featured Grid */}
      {featuredArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article, idx) => {
              const category = categories.find((c) => c.id === article.category_id);
              return (
                <div
                  key={article.id}
                  className="group relative overflow-hidden rounded-xl h-96 md:h-full md:min-h-[500px]"
                >
                  {article.featured_image_url && (
                    <Image
                      src={article.featured_image_url}
                      alt={article.title || article.original_title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    {category && (
                      <span className="inline-block w-fit mb-3 px-3 py-1 text-xs font-bold rounded-full bg-[var(--accent)] text-white">
                        {category.name}
                      </span>
                    )}
                    <Link href={`/s/${site.slug}/${article.slug}`} className="group/link">
                      <h2 className="text-2xl md:text-3xl font-black text-white group-hover/link:text-[var(--accent)] transition-colors mb-2 line-clamp-3">
                        {article.title || article.original_title}
                      </h2>
                    </Link>
                    <p className="text-white text-sm opacity-90">
                      {article.excerpt || article.meta_description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <CategoryFilter
            categories={categories}
            siteSlug={site.slug}
            currentCategory={currentCategory}
          />
        </div>
      )}

      {/* Rest of Articles Grid */}
      {restArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
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
        </section>
      )}

      {articles.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No articles found. Check back soon!
          </p>
        </section>
      )}
    </main>
  );
}
