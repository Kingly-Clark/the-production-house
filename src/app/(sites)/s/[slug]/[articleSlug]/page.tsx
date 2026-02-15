import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateArticleMeta } from '@/lib/seo/meta';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo/jsonld';
import ArticleFull from '@/components/site/ArticleFull';
import TrendingTopics from '@/components/site/TrendingTopics';
import LatestStories from '@/components/site/LatestStories';
import NewsletterSignup from '@/components/site/NewsletterSignup';
import BacklinkBanner from '@/components/site/BacklinkBanner';
import Link from 'next/link';

interface ArticlePageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

async function getArticleData(siteSlug: string, articleSlug: string) {
  const supabase = createAdminClient();

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', siteSlug)
    .single();

  if (!site) return null;

  // Get site settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('site_id', site.id)
    .single();

  // Get article
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single();

  if (!article) return null;

  // Get category
  let category: import('@/types/database').Category | undefined = undefined;
  if (article.category_id) {
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', article.category_id)
      .single();
    category = catData ?? undefined;
  }

  // Get categories for sidebar
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', site.id)
    .order('article_count', { ascending: false });
  const categories = categoriesData ?? [];

  // Get related articles (same category)
  let relatedArticles: typeof article[] = [];
  if (article.category_id) {
    const { data: related = [] } = await supabase
      .from('articles')
      .select('*')
      .eq('site_id', site.id)
      .eq('category_id', article.category_id)
      .eq('status', 'published')
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(5);
    relatedArticles = related ?? [];
  }

  // Get backlink settings
  const { data: backlinksData } = await supabase
    .from('backlink_settings')
    .select('*')
    .eq('site_id', site.id)
    .single();

  // View count is now tracked client-side via /api/articles/[id]/view
  // to avoid inflated counts from bots and SSR

  return {
    site,
    settings: settings || {
      id: '',
      site_id: site.id,
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      accent_color: '#0ea5e9',
      text_color: '#1f2937',
      background_color: '#ffffff',
      font_heading: 'system-ui',
      font_body: 'system-ui',
      logo_url: null,
      favicon_url: null,
      custom_css: null,
      meta_title: null,
      meta_description: null,
      og_image_url: null,
      google_analytics_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    article,
    category,
    categories,
    relatedArticles,
    backlinkSettings: backlinksData || null,
  };
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const data = await getArticleData(slug, articleSlug);

  if (!data) {
    return { title: 'Article Not Found' };
  }

  return generateArticleMeta(data.article, data.site, data.settings);
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug, articleSlug } = await params;
  const data = await getArticleData(slug, articleSlug);

  if (!data) {
    notFound();
  }

  const {
    site,
    settings,
    article,
    category,
    categories,
    relatedArticles,
    backlinkSettings,
  } = data;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const articleSchema = generateArticleSchema(article, site, baseUrl);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `${baseUrl}/s/${site.slug}` },
    category
      ? { name: category.name, url: `${baseUrl}/s/${site.slug}/category/${category.slug}` }
      : { name: 'Articles', url: `${baseUrl}/s/${site.slug}` },
    { name: article.title || article.original_title, url: `${baseUrl}/s/${site.slug}/${article.slug}` },
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
        <Link href={`/s/${site.slug}`} className="hover:text-[var(--accent)]">
          Home
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link
              href={`/s/${site.slug}/category/${category.slug}`}
              className="hover:text-[var(--accent)]"
            >
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium line-clamp-1">
          {article.title || article.original_title}
        </span>
      </nav>

      {/* Backlink Banner */}
      {backlinkSettings && <BacklinkBanner settings={backlinkSettings} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <ArticleFull article={article} site={site} category={category} />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Newsletter */}
          <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Subscribe</h3>
            <p className="text-sm opacity-90 mb-4">
              Get updates on new articles like this one.
            </p>
            <NewsletterSignup siteSlug={site.slug} fullWidth buttonText="Subscribe" />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="font-bold text-lg text-[var(--text)] mb-4">
                Related in {category?.name}
              </h3>
              <div className="space-y-4">
                {relatedArticles.map((related) => (
                  <article key={related.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <Link
                      href={`/s/${site.slug}/${related.slug}`}
                      className="group block"
                    >
                      <h4 className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                        {related.title || related.original_title}
                      </h4>
                    </Link>
                    {related.published_at && (
                      <time className="text-xs text-gray-500 mt-1 block">
                        {new Date(related.published_at).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </time>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          <TrendingTopics categories={categories} siteSlug={site.slug} />

          {/* Latest Stories */}
          <LatestStories articles={relatedArticles.length > 0 ? relatedArticles : categories.length > 0 ? [] : []} siteSlug={site.slug} />
        </aside>
      </div>
    </main>
  );
}
