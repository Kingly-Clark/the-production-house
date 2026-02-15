import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type {
  Site,
  SiteSettings,
  Article,
  Category,
  TemplateId,
} from '@/types/database';
import ClassicTemplate from '@/components/templates/ClassicTemplate';
import MagazineTemplate from '@/components/templates/MagazineTemplate';
import MinimalTemplate from '@/components/templates/MinimalTemplate';
import BoldTemplate from '@/components/templates/BoldTemplate';
import TechTemplate from '@/components/templates/TechTemplate';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getSiteDataAndArticles(
  slug: string,
  page: number = 1
): Promise<{
  site: Site;
  settings: SiteSettings;
  articles: Article[];
  categories: Category[];
} | null> {
  const supabase = createAdminClient();

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!site) return null;

  // Get site settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('site_id', site.id)
    .single();

  // Get published articles with pagination
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: articles = [] } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  // Get categories
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
  };
}

const templateMap: Record<TemplateId, typeof ClassicTemplate> = {
  classic: ClassicTemplate,
  magazine: MagazineTemplate,
  minimal: MinimalTemplate,
  bold: BoldTemplate,
  tech: TechTemplate,
};

export default async function SitePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page = '1' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);

  const siteData = await getSiteDataAndArticles(slug, pageNum);

  if (!siteData) {
    notFound();
  }

  const { site, settings, articles, categories } = siteData;
  const TemplateComponent = templateMap[site.template_id] || ClassicTemplate;

  return (
    <TemplateComponent
      site={site}
      settings={settings}
      articles={articles}
      categories={categories}
    />
  );
}
