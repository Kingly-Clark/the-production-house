// Production House — Resend Email Client
// Handles all email sending operations for newsletters and subscriber management
// =============================================================

import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResend() as any)[prop];
  },
});

export interface SendEmailInput {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface BatchEmailInput {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export interface SendConfirmationEmailInput {
  to: string;
  siteSlug: string;
  siteName: string;
  confirmationToken: string;
}

export interface SendUnsubscribeConfirmationInput {
  to: string;
  siteName: string;
}

/**
 * Send a single email via Resend
 */
export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  try {
    const response = await resend.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });

    if (response.error) {
      throw new Error(`Resend error: ${response.error.message}`);
    }

    if (!response.data?.id) {
      throw new Error('No email ID returned from Resend');
    }

    return { id: response.data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send batch emails via Resend (max 100 per batch)
 * Automatically chunks into batches if needed
 */
export async function sendBatchEmails(input: {
  emails: BatchEmailInput[];
}): Promise<{ batchId: string; sent: number }> {
  const emails = input.emails;
  const maxBatchSize = 100;
  const batches = Math.ceil(emails.length / maxBatchSize);

  let totalSent = 0;
  let lastBatchId = '';

  try {
    for (let i = 0; i < batches; i++) {
      const start = i * maxBatchSize;
      const end = Math.min(start + maxBatchSize, emails.length);
      const batchEmails = emails.slice(start, end);

      const response = await resend.batch.send(
        batchEmails.map((email) => ({
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
        }))
      );

      if (response.error) {
        throw new Error(`Resend batch error: ${response.error.message}`);
      }

      if (!response.data) {
        throw new Error('No batch data returned from Resend');
      }

      lastBatchId = response.data[0] || '';
      totalSent += batchEmails.length;
    }

    return { batchId: lastBatchId, sent: totalSent };
  } catch (error) {
    console.error('Error sending batch emails:', error);
    throw error;
  }
}

/**
 * Send newsletter confirmation email with double opt-in link
 */
export async function sendConfirmationEmail(
  input: SendConfirmationEmailInput
): Promise<{ id: string }> {
  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/public/site/${input.siteSlug}/confirm?token=${input.confirmationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Subscription</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px; }
          .content p { margin: 0 0 16px 0; }
          .cta-button { display: inline-block; background-color: #667eea; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0; }
          .cta-button:hover { background-color: #5568d3; }
          .footer { background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .footer-text { margin: 0; }
          .divider { height: 1px; background-color: #e5e7eb; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirm Your Subscription</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p>Thanks for subscribing to <strong>${input.siteName}</strong>'s newsletter. To complete your subscription, please confirm your email address by clicking the button below.</p>
            <a href="${confirmationUrl}" class="cta-button">Confirm Email</a>
            <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link in your browser:</p>
            <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${confirmationUrl}</p>
            <p>If you didn't sign up for this newsletter, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p class="footer-text">© 2024 Production House. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: input.to,
    from: `noreply@productionhouse.ai`,
    subject: `Confirm your subscription to ${input.siteName}`,
    html,
  });
}

/**
 * Send unsubscribe confirmation email
 */
export async function sendUnsubscribeConfirmation(
  input: SendUnsubscribeConfirmationInput
): Promise<{ id: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribe Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px; }
          .content p { margin: 0 0 16px 0; }
          .footer { background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .footer-text { margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Unsubscribed</h1>
          </div>
          <div class="content">
            <p>You have been successfully unsubscribed from ${input.siteName}'s newsletter.</p>
            <p>You won't receive any more emails from this newsletter.</p>
            <p>If you change your mind, you can always subscribe again.</p>
          </div>
          <div class="footer">
            <p class="footer-text">© 2024 Production House. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: input.to,
    from: `noreply@productionhouse.ai`,
    subject: `You've been unsubscribed from ${input.siteName}`,
    html,
  });
}
