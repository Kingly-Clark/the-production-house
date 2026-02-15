import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSiteMeta } from '@/lib/seo/meta';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import type { Site, SiteSettings, Category } from '@/types/database';

interface SiteLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getSiteData(slug: string): Promise<{
  site: Site;
  settings: SiteSettings;
  categories: Category[];
} | null> {
  const supabase = createAdminClient();

  const { data: siteData, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .single();

  if (siteError || !siteData) {
    return null;
  }

  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('*')
    .eq('site_id', siteData.id)
    .single();

  const { data: categoriesData = [] } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', siteData.id)
    .order('article_count', { ascending: false });

  return {
    site: siteData,
    settings: settingsData || {
      id: '',
      site_id: siteData.id,
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
    categories: categoriesData ?? [],
  };
}

export async function generateMetadata({
  params,
}: SiteLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const siteData = await getSiteData(slug);

  if (!siteData) {
    return {
      title: 'Site Not Found',
    };
  }

  return generateSiteMeta(siteData.site, siteData.settings);
}

export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { slug } = await params;
  const siteData = await getSiteData(slug);

  if (!siteData) {
    notFound();
  }

  const { site, settings, categories } = siteData;

  // CSS variables for theming
  const cssVariables = `
    --primary: ${settings.primary_color};
    --secondary: ${settings.secondary_color};
    --accent: ${settings.accent_color};
    --text: ${settings.text_color};
    --bg: ${settings.background_color};
    --font-heading: ${settings.font_heading};
    --font-body: ${settings.font_body};
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          '--primary': settings.primary_color,
          '--secondary': settings.secondary_color,
          '--accent': settings.accent_color,
          '--text': settings.text_color,
          '--bg': settings.background_color,
          '--font-heading': settings.font_heading,
          '--font-body': settings.font_body,
        } as React.CSSProperties
      }
    >
      <head>
        <style>
          {`
            :root {
              ${cssVariables}
            }

            body {
              color: var(--text);
              background-color: var(--bg);
              font-family: var(--font-body);
            }

            h1, h2, h3, h4, h5, h6 {
              font-family: var(--font-heading);
            }

            ${settings.custom_css || ''}
          `}
        </style>
        {settings.favicon_url && (
          <link rel="icon" href={settings.favicon_url} />
        )}
        {settings.google_analytics_id && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`}
            />
            <script>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.google_analytics_id}');
              `}
            </script>
          </>
        )}
      </head>
      <body className="antialiased transition-colors">
        <SiteHeader site={site} settings={settings} categories={categories} />
        {children}
        <SiteFooter site={site} />
      </body>
    </html>
  );
}
