// Production House — Newsletter Sender
// Handles sending newsletters to confirmed subscribers
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, NewsletterLog } from '@/types/database';
import { buildWeeklyDigest } from './builder';
import { sendBatchEmails } from './resend-client';

export interface SendNewsletterResult {
  success: boolean;
  recipientCount: number;
  loggingId?: string;
  articleCount: number;
  error?: string;
}

/**
 * Get the sender email address for a site
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
 * Send weekly newsletter to all confirmed subscribers of a site
 */
export async function sendWeeklyNewsletter(siteId: string): Promise<SendNewsletterResult> {
  const supabase = createAdminClient();

  try {
    // Build the digest - skip if no articles this week
    const digest = await buildWeeklyDigest(siteId);

    if (!digest) {
      console.log(`No articles found for site ${siteId} - skipping newsletter`);
      return {
        success: true,
        recipientCount: 0,
        articleCount: 0,
      };
    }

    // Get all confirmed subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_confirmed', true)
      .is('unsubscribed_at', null);

    if (subscribersError) {
      throw new Error(`Error fetching subscribers: ${subscribersError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log(`No confirmed subscribers for site ${siteId}`);
      return {
        success: true,
        recipientCount: 0,
        articleCount: digest.articleCount,
      };
    }

    // Get sender address
    const fromAddress = await getSenderEmail(siteId);

    // Create newsletter log record
    const { data: logEntry, error: logError } = await supabase
      .from('newsletter_log')
      .insert({
        site_id: siteId,
        subject: digest.subject,
        content_html: digest.html,
        summary_text: digest.html,
        recipient_count: subscribers.length,
        status: 'sending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Error creating newsletter log: ${logError.message}`);
    }

    // Prepare batch emails
    const emails = subscribers.map((subscriber) => {
      const htmlWithToken = digest.html.replace(
        '{unsubscribe_token}',
        subscriber.unsubscribe_token
      );

      return {
        to: subscriber.email,
        from: fromAddress,
        subject: digest.subject,
        html: htmlWithToken,
      };
    });

    // Send batch emails
    try {
      const batchResult = await sendBatchEmails({ emails });

      // Update newsletter log with success
      const { error: updateError } = await supabase
        .from('newsletter_log')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_batch_id: batchResult.batchId,
        })
        .eq('id', logEntry.id);

      if (updateError) {
        console.error('Error updating newsletter log:', updateError);
      }

      console.log(`Newsletter sent to ${batchResult.sent} subscribers for site ${siteId}`);

      return {
        success: true,
        recipientCount: batchResult.sent,
        loggingId: logEntry.id,
        articleCount: digest.articleCount,
      };
    } catch (sendError) {
      // Update newsletter log with failure
      const { error: updateError } = await supabase
        .from('newsletter_log')
        .update({
          status: 'failed',
          resend_batch_id: null,
        })
        .eq('id', logEntry.id);

      if (updateError) {
        console.error('Error updating newsletter log on failure:', updateError);
      }

      throw sendError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending newsletter for site ${siteId}:`, error);

    return {
      success: false,
      recipientCount: 0,
      articleCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Send newsletter to a specific list of emails (for testing/manual send)
 */
export async function sendNewsletterToEmails(
  siteId: string,
  emails: string[]
): Promise<SendNewsletterResult> {
  const supabase = createAdminClient();

  try {
    // Build the digest
    const digest = await buildWeeklyDigest(siteId);

    if (!digest) {
      console.log(`No articles found for site ${siteId}`);
      return {
        success: true,
        recipientCount: 0,
        articleCount: 0,
      };
    }

    const fromAddress = await getSenderEmail(siteId);

    // Prepare emails
    const batchEmails = emails.map((email) => ({
      to: email,
      from: fromAddress,
      subject: digest.subject,
      html: digest.html,
    }));

    // Send batch
    const batchResult = await sendBatchEmails({ emails: batchEmails });

    // Log it
    const { error: logError } = await supabase.from('newsletter_log').insert({
      site_id: siteId,
      subject: digest.subject,
      content_html: digest.html,
      summary_text: digest.html,
      recipient_count: emails.length,
      status: 'sent',
      sent_at: new Date().toISOString(),
      resend_batch_id: batchResult.batchId,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('Error logging test newsletter:', logError);
    }

    return {
      success: true,
      recipientCount: batchResult.sent,
      articleCount: digest.articleCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending test newsletter for site ${siteId}:`, error);

    return {
      success: false,
      recipientCount: 0,
      articleCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Get newsletter send history for a site
 */
export async function getNewsletterHistory(
  siteId: string,
  limit: number = 10
): Promise<NewsletterLog[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('newsletter_log')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching newsletter history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get newsletter statistics for a site
 */
export async function getNewsletterStats(siteId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('newsletter_log')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}
