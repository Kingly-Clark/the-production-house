// Production House — Newsletter Module Exports
// Central export file for all newsletter-related functions
// =============================================================

// Resend client functions
export {
  sendEmail,
  sendBatchEmails,
  sendConfirmationEmail,
  sendUnsubscribeConfirmation,
  type SendEmailInput,
  type BatchEmailInput,
  type SendConfirmationEmailInput,
  type SendUnsubscribeConfirmationInput,
} from './resend-client';

// Newsletter builder functions
export { buildWeeklyDigest, type NewsletterDigest } from './builder';

// Newsletter sender functions
export {
  sendWeeklyNewsletter,
  sendNewsletterToEmails,
  getNewsletterHistory,
  getNewsletterStats,
  type SendNewsletterResult,
} from './sender';

// Subscriber management functions
export {
  subscribeToSite,
  confirmSubscription,
  unsubscribe,
  getConfirmedSubscribers,
  getSubscriberCount,
  isEmailSubscribed,
} from './subscribers';
