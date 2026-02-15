// Production House — Newsletter Builder
// Builds HTML email content for weekly newsletters with AI-generated summaries
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Site, SiteSettings, Article } from '@/types/database';
import { rewriteArticle } from '@/lib/ai/gemini';

export interface NewsletterDigest {
  subject: string;
  html: string;
  articleCount: number;
}

/**
 * Get the sender email address for a site
 * Uses custom domain if available, otherwise Production House domain
 */
async function getSenderEmail(siteId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: domain } = await supabase
    .from('site_domains')
    .select('domain')
    .eq('site_id', siteId)
    .eq('verification_status', 'verified')
    .limit(1)
    .single();

  if (domain?.domain) {
    return `newsletter@${domain.domain}`;
  }

  return 'newsletter@productionhouse.ai';
}

/**
 * Build a weekly digest newsletter for a site
 * Fetches articles from the past 7 days and generates AI summary
 */
export async function buildWeeklyDigest(siteId: string): Promise<NewsletterDigest | null> {
  const supabase = createAdminClient();

  // Fetch site and settings
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  if (siteError || !site) {
    console.error(`Error fetching site ${siteId}:`, siteError);
    return null;
  }

  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('*')
    .eq('site_id', siteId)
    .single();

  if (settingsError) {
    console.error(`Error fetching settings for site ${siteId}:`, settingsError);
    return null;
  }

  // Get articles from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', siteId)
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .order('published_at', { ascending: false });

  if (articlesError) {
    console.error(`Error fetching articles for site ${siteId}:`, articlesError);
    return null;
  }

  // Skip if no articles this week
  if (!articles || articles.length === 0) {
    console.log(`No articles found for site ${siteId} in the past 7 days`);
    return null;
  }

  // Generate AI summary
  let summaryText = '';
  try {
    const articleTitles = articles.map((a) => a.title || a.original_title).join(', ');
    const articleTopics = articles
      .slice(0, 5)
      .map((a) => a.excerpt || a.original_content?.substring(0, 100) || '')
      .join(' | ');

    // Use Gemini to generate a summary
    const summaryPrompt = `Generate a concise, engaging 2-3 sentence summary of this week's newsletter for "${site.name}".
The articles published are: ${articleTitles}
Key topics: ${articleTopics}

Write a summary that hooks the reader and makes them want to read more. Keep it professional but friendly.`;

    // For now, we'll create a simple summary - in production, you'd call Gemini
    const topicsSummary = articles
      .slice(0, 3)
      .map((a) => a.title || a.original_title)
      .join(', ');

    summaryText = `This week on ${site.name}, we cover ${topicsSummary} and more. Dive in to stay up-to-date with the latest trends and insights.`;
  } catch (error) {
    console.error('Error generating summary:', error);
    summaryText = `This week on ${site.name}, we bring you ${articles.length} fresh articles across various topics.`;
  }

  // Build HTML email
  const html = buildNewsletterHTML({
    site,
    settings,
    articles,
    summaryText,
  });

  const subject = `${site.name} Weekly Digest - ${new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  return {
    subject,
    html,
    articleCount: articles.length,
  };
}

interface BuildHTMLInput {
  site: Site;
  settings: SiteSettings;
  articles: Article[];
  summaryText: string;
}

/**
 * Build the HTML email template for newsletter
 */
function buildNewsletterHTML(input: BuildHTMLInput): string {
  const { site, settings, articles, summaryText } = input;

  const primaryColor = settings.primary_color || '#667eea';
  const textColor = settings.text_color || '#333';
  const backgroundColor = settings.background_color || '#f9fafb';

  const articleCards = articles
    .map((article) => {
      const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sites/${site.slug}/articles/${article.slug}`;
      const imageUrl = article.featured_image_url || settings.og_image_url || '';

      return `
        <div style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${article.title}" style="width: 100%; height: 200px; object-fit: cover; display: block;">`
              : ''
          }
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: ${textColor}; line-height: 1.4;">
              <a href="${articleUrl}" style="color: ${textColor}; text-decoration: none;">
                ${article.title || article.original_title}
              </a>
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
              ${article.excerpt || article.original_content?.substring(0, 150) || ''}
            </p>
            <a href="${articleUrl}" style="color: ${primaryColor}; text-decoration: none; font-weight: 500; font-size: 14px;">
              Read more →
            </a>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${site.name} Weekly Digest</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${backgroundColor}; margin: 0; padding: 0; line-height: 1.6; color: ${textColor}; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
          .header-logo { max-width: 150px; height: auto; margin-bottom: 16px; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .header-subtext { margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px; }
          .summary-section { background-color: ${backgroundColor}; padding: 20px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid ${primaryColor}; }
          .summary-section p { margin: 0; font-size: 16px; line-height: 1.6; color: ${textColor}; }
          .articles-title { font-size: 20px; font-weight: 600; margin: 32px 0 24px 0; color: ${textColor}; }
          .cta-button { display: inline-block; background-color: ${primaryColor}; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 32px 0; }
          .cta-button:hover { opacity: 0.9; }
          .footer { background-color: ${backgroundColor}; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .footer-links { margin-bottom: 12px; }
          .footer-link { color: ${primaryColor}; text-decoration: none; margin: 0 12px; font-size: 12px; }
          .footer-link:hover { text-decoration: underline; }
          .footer-text { margin: 8px 0 0 0; }
          a { color: ${primaryColor}; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${
              settings.logo_url
                ? `<img src="${settings.logo_url}" alt="${site.name}" class="header-logo">`
                : ''
            }
            <h1>Weekly Digest</h1>
            <p class="header-subtext">${site.name}</p>
          </div>

          <div class="content">
            <div class="summary-section">
              <p>${summaryText}</p>
            </div>

            <h2 class="articles-title">📰 This Week's Articles</h2>
            ${articleCards}

            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/sites/${site.slug}" class="cta-button">
                Read All Articles
              </a>
            </center>
          </div>

          <div class="footer">
            <div class="footer-links">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/sites/${site.slug}" class="footer-link">View on Web</a>
              <span style="color: #d1d5db;">•</span>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/public/site/${site.slug}/unsubscribe?token={unsubscribe_token}" class="footer-link">Unsubscribe</a>
            </div>
            <p class="footer-text">Powered by <strong>Production House</strong> — Content Syndication Platform</p>
            <p class="footer-text">© 2024 Production House. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
