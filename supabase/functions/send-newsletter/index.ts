// Production House — Send Newsletter Edge Function
// Runs every Friday at 10am UTC via pg_cron
// Sends weekly digest newsletters to all confirmed subscribers
// =============================================================

import { createAdminClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

interface SiteRow {
  id: string;
  name: string;
  slug: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  unsubscribe_token: string;
}

interface ArticleRow {
  id: string;
  site_id: string;
  title: string | null;
  original_title: string;
  excerpt: string | null;
  original_content: string | null;
  featured_image_url: string | null;
  slug: string | null;
  published_at: string;
}

interface SiteSettingsRow {
  logo_url: string | null;
  primary_color: string;
  text_color: string;
  background_color: string;
}

interface ResendResponse {
  data?: { id: string }[];
  error?: { message: string };
}

/**
 * Get articles from the past 7 days for a site
 */
async function getWeeklyArticles(
  supabase: ReturnType<typeof createAdminClient>,
  siteId: string
): Promise<ArticleRow[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('articles')
    .select('id, site_id, title, original_title, excerpt, original_content, featured_image_url, slug, published_at')
    .eq('site_id', siteId)
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .order('published_at', { ascending: false });

  if (error) {
    console.error(`Error fetching articles for site ${siteId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Get site settings
 */
async function getSiteSettings(
  supabase: ReturnType<typeof createAdminClient>,
  siteId: string
): Promise<SiteSettingsRow | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('logo_url, primary_color, text_color, background_color')
    .eq('site_id', siteId)
    .single();

  if (error) {
    console.error(`Error fetching settings for site ${siteId}:`, error);
    return null;
  }

  return data;
}

/**
 * Build newsletter HTML
 */
function buildNewsletterHTML(
  site: SiteRow,
  settings: SiteSettingsRow,
  articles: ArticleRow[]
): string {
  const primaryColor = settings.primary_color || '#667eea';
  const textColor = settings.text_color || '#333';
  const backgroundColor = settings.background_color || '#f9fafb';
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://productionhouse.ai';

  // Generate article cards HTML
  const articleCards = articles
    .slice(0, 10) // Limit to 10 articles
    .map((article) => {
      const articleUrl = `${appUrl}/sites/${site.slug}/articles/${article.slug}`;
      const imageUrl = article.featured_image_url || '';

      return `
        <div style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${article.title || article.original_title}" style="width: 100%; height: 200px; object-fit: cover; display: block;">`
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

  // Generate summary
  const summaryText =
    articles.length > 0
      ? `This week on ${site.name}, we cover ${articles
          .slice(0, 3)
          .map((a) => a.title || a.original_title)
          .join(', ')} and more. Dive in to stay up-to-date.`
      : `Check out this week's articles on ${site.name}.`;

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
              <a href="${appUrl}/sites/${site.slug}" class="cta-button">
                Read All Articles
              </a>
            </center>
          </div>

          <div class="footer">
            <div class="footer-links">
              <a href="${appUrl}/sites/${site.slug}" class="footer-link">View on Web</a>
              <span style="color: #d1d5db;">•</span>
              <a href="${appUrl}/api/public/site/${site.slug}/unsubscribe?token={unsubscribe_token}" class="footer-link">Unsubscribe</a>
            </div>
            <p class="footer-text">Powered by <strong>Production House</strong> — Content Syndication Platform</p>
            <p class="footer-text">© 2024 Production House. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get sender email for a site
 */
async function getSenderEmail(
  supabase: ReturnType<typeof createAdminClient>,
  siteId: string
): Promise<string> {
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
 * Send emails via Resend
 */
async function sendEmails(
  fromAddress: string,
  subject: string,
  html: string,
  emails: SubscriberRow[]
): Promise<{ sent: number; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { sent: 0, error: 'Resend API key not configured' };
  }

  try {
    // Send up to 100 at a time
    const batchSize = 100;
    let totalSent = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, Math.min(i + batchSize, emails.length));

      const batchEmails = batch.map((subscriber) => ({
        from: fromAddress,
        to: subscriber.email,
        subject,
        html: html.replace('{unsubscribe_token}', subscriber.unsubscribe_token),
      }));

      const response = await fetch('https://api.resend.com/email/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(batchEmails),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resend batch error:', errorData);
        return { sent: totalSent, error: `Resend error: ${response.statusText}` };
      }

      totalSent += batch.length;
    }

    return { sent: totalSent };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error sending emails:', errorMsg);
    return { sent: 0, error: errorMsg };
  }
}

/**
 * Main function - process all active sites and send newsletters
 */
async function main() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createAdminClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();
  const results: Array<{ siteId: string; siteName: string; sent: number; error?: string }> = [];
  let totalSent = 0;
  let processedSites = 0;

  try {
    // Get all active sites with newsletter enabled
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, slug')
      .eq('cron_enabled', true)
      .eq('status', 'active');

    if (sitesError) {
      throw new Error(`Error fetching sites: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      console.log('No active sites to send newsletters for');

      // Log job completion
      await supabase.from('job_log').insert({
        job_type: 'send_newsletter',
        site_id: null,
        status: 'completed',
        articles_fetched: 0,
        articles_rewritten: 0,
        articles_published: 0,
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({ success: true, sitesProcessed: 0, totalSent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process each site
    for (const site of sites) {
      try {
        console.log(`Processing site: ${site.name} (${site.id})`);

        // Get articles from past 7 days
        const articles = await getWeeklyArticles(supabase, site.id);

        if (articles.length === 0) {
          console.log(`No articles found for site ${site.id} - skipping`);
          results.push({ siteId: site.id, siteName: site.name, sent: 0 });
          continue;
        }

        // Get site settings
        const settings = await getSiteSettings(supabase, site.id);
        if (!settings) {
          console.log(`No settings found for site ${site.id} - skipping`);
          results.push({ siteId: site.id, siteName: site.name, sent: 0, error: 'No settings' });
          continue;
        }

        // Build HTML
        const html = buildNewsletterHTML(site, settings, articles);
        const subject = `${site.name} Weekly Digest - ${
          new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }`;

        // Get confirmed subscribers
        const { data: subscribers, error: subscribersError } = await supabase
          .from('subscribers')
          .select('id, email, unsubscribe_token')
          .eq('site_id', site.id)
          .eq('is_confirmed', true)
          .is('unsubscribed_at', null);

        if (subscribersError || !subscribers || subscribers.length === 0) {
          console.log(`No confirmed subscribers for site ${site.id}`);
          results.push({ siteId: site.id, siteName: site.name, sent: 0 });
          processedSites++;
          continue;
        }

        // Get sender email
        const fromAddress = await getSenderEmail(supabase, site.id);

        // Send emails
        const sendResult = await sendEmails(fromAddress, subject, html, subscribers);

        if (sendResult.error) {
          console.error(`Error sending emails for site ${site.id}:`, sendResult.error);
          results.push({
            siteId: site.id,
            siteName: site.name,
            sent: sendResult.sent,
            error: sendResult.error,
          });
        } else {
          console.log(`Successfully sent ${sendResult.sent} emails for site ${site.id}`);
          results.push({
            siteId: site.id,
            siteName: site.name,
            sent: sendResult.sent,
          });
          totalSent += sendResult.sent;
        }

        // Log newsletter in database
        await supabase.from('newsletter_log').insert({
          site_id: site.id,
          subject,
          content_html: html,
          summary_text: html,
          recipient_count: subscribers.length,
          status: sendResult.error ? 'failed' : 'sent',
          sent_at: sendResult.error ? null : new Date().toISOString(),
          resend_batch_id: null,
          created_at: new Date().toISOString(),
        });

        processedSites++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error processing site ${site.id}:`, errorMsg);
        results.push({
          siteId: site.id,
          siteName: site.name,
          sent: 0,
          error: errorMsg,
        });
      }
    }

    // Log job completion
    const duration = Date.now() - startTime;
    const errors = results.filter((r) => r.error).map((r) => `${r.siteName}: ${r.error}`);

    await supabase.from('job_log').insert({
      job_type: 'send_newsletter',
      site_id: null,
      status: 'completed',
      articles_fetched: 0,
      articles_rewritten: 0,
      articles_published: totalSent,
      error_message: errors.length > 0 ? errors.join('; ') : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sitesProcessed,
        totalSent,
        results,
        errors: errors.length > 0 ? errors : null,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Newsletter send job failed:', errorMsg);

    // Log job failure
    const duration = Date.now() - startTime;
    await supabase.from('job_log').insert({
      job_type: 'send_newsletter',
      site_id: null,
      status: 'failed',
      articles_fetched: 0,
      articles_rewritten: 0,
      articles_published: 0,
      error_message: errorMsg,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

Deno.serve(main);
