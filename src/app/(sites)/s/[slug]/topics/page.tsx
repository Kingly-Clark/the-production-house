import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

interface TopicsPageProps {
  params: Promise<{ slug: string }>;
}

async function getTopicsData(siteSlug: string) {
  const supabase = createAdminClient();

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', siteSlug)
    .single();

  if (!site) return null;

  // Get all categories with article counts
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', site.id)
    .order('name', { ascending: true });

  return {
    site,
    categories: categories ?? [],
  };
}

export async function generateMetadata({
  params,
}: TopicsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTopicsData(slug);

  if (!data) {
    return { title: 'Topics Not Found' };
  }

  const { site } = data;
  const title = `Topics — ${site.name}`;
  const description = `Browse all topics on ${site.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/s/${site.slug}/topics`,
    },
  };
}

export default async function TopicsPage({ params }: TopicsPageProps) {
  const { slug } = await params;
  const data = await getTopicsData(slug);

  if (!data) {
    notFound();
  }

  const { site, categories } = data;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Topics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse articles by topic
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No topics found. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/s/${site.slug}/category/${category.slug}`}
              className="group p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {category.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {category.article_count} {category.article_count === 1 ? 'article' : 'articles'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
