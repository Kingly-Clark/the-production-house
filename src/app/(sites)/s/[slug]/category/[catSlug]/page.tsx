import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { TemplateId } from '@/types/database';
import ClassicTemplate from '@/components/templates/ClassicTemplate';
import MagazineTemplate from '@/components/templates/MagazineTemplate';
import MinimalTemplate from '@/components/templates/MinimalTemplate';
import BoldTemplate from '@/components/templates/BoldTemplate';
import TechTemplate from '@/components/templates/TechTemplate';

interface CategoryPageProps {
  params: Promise<{ slug: string; catSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategoryData(siteSlug: string, categorySlug: string, page: number = 1) {
  const supabase = await createClient();

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

  // Get category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', categorySlug)
    .single();

  if (!category) return null;

  // Get articles in category with pagination
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: articles = [] } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  // Get all categories
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', site.id)
    .order('article_count', { ascending: false });

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
    articles: articles ?? [],
    categories: categories ?? [],
    category,
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug, catSlug } = await params;
  const data = await getCategoryData(slug, catSlug);

  if (!data) {
    return { title: 'Category Not Found' };
  }

  const { site, category } = data;
  const title = `${category.name} — ${site.name}`;
  const description = `Articles in ${category.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/s/${site.slug}/category/${category.slug}`,
    },
  };
}

const templateMap: Record<TemplateId, typeof ClassicTemplate> = {
  classic: ClassicTemplate,
  magazine: MagazineTemplate,
  minimal: MinimalTemplate,
  bold: BoldTemplate,
  tech: TechTemplate,
};

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug, catSlug } = await params;
  const { page = '1' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);

  const data = await getCategoryData(slug, catSlug, pageNum);

  if (!data) {
    notFound();
  }

  const { site, settings, articles, categories, category } = data;
  const TemplateComponent = templateMap[site.template_id] || ClassicTemplate;

  return (
    <TemplateComponent
      site={site}
      settings={settings}
      articles={articles}
      categories={categories}
      currentCategory={category.slug}
    />
  );
}
