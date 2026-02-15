import type { Site, SiteSettings, Article, Category } from '@/types/database';
import ArticleCard from '@/components/site/ArticleCard';
import TrendingTopics from '@/components/site/TrendingTopics';
import LatestStories from '@/components/site/LatestStories';
import NewsletterSignup from '@/components/site/NewsletterSignup';
import CategoryFilter from '@/components/site/CategoryFilter';

interface ClassicTemplateProps {
  site: Site;
  settings: SiteSettings;
  articles: Article[];
  categories: Category[];
  currentCategory?: string;
}

export default function ClassicTemplate({
  site,
  settings,
  articles,
  categories,
  currentCategory,
}: ClassicTemplateProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        siteSlug={site.slug}
        currentCategory={currentCategory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No articles found. Check back soon!
              </p>
            </div>
          ) : (
            articles.map((article) => {
              const category = categories.find((c) => c.id === article.category_id);
              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  category={category}
                  slug={site.slug}
                  variant="horizontal"
                />
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Newsletter */}
          <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Stay Updated</h3>
            <p className="text-sm opacity-90 mb-4">
              Get the latest articles delivered to your inbox.
            </p>
            <NewsletterSignup siteSlug={site.slug} fullWidth buttonText="Subscribe" />
          </div>

          {/* Trending Topics */}
          <TrendingTopics categories={categories} siteSlug={site.slug} />

          {/* Latest Stories */}
          <LatestStories articles={articles} siteSlug={site.slug} />
        </aside>
      </div>
    </main>
  );
}
