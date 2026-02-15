// Production House — Newsletter Subscriber Management
// Handles subscription, confirmation, and unsubscription
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Subscriber } from '@/types/database';
import { sendConfirmationEmail, sendUnsubscribeConfirmation } from './resend-client';
import crypto from 'crypto';

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Subscribe a user to a site's newsletter
 * Creates subscriber record and sends confirmation email
 */
export async function subscribeToSite(
  siteId: string,
  email: string
): Promise<{ subscriber: Subscriber; confirmationSent: boolean }> {
  const supabase = createAdminClient();

  // Check if subscriber already exists
  const { data: existing } = await supabase
    .from('subscribers')
    .select('*')
    .eq('site_id', siteId)
    .eq('email', email)
    .maybeSingle();

  if (existing && existing.is_confirmed) {
    // Already confirmed, return existing
    return {
      subscriber: existing,
      confirmationSent: false,
    };
  }

  const confirmationToken = generateToken();
  const unsubscribeToken = generateToken();

  // Create or update subscriber record
  let subscriber: Subscriber;

  if (existing) {
    // Update existing unconfirmed subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .update({
        confirmation_token: confirmationToken,
        unsubscribe_token: unsubscribeToken,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating subscriber: ${error.message}`);
    }

    subscriber = data;
  } else {
    // Create new subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        site_id: siteId,
        email,
        is_confirmed: false,
        confirmation_token: confirmationToken,
        unsubscribe_token: unsubscribeToken,
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating subscriber: ${error.message}`);
    }

    subscriber = data;
  }

  // Get site info for email
  const { data: site } = await supabase.from('sites').select('name, slug').eq('id', siteId).single();

  if (!site) {
    throw new Error('Site not found');
  }

  // Send confirmation email
  try {
    await sendConfirmationEmail({
      to: email,
      siteSlug: site.slug,
      siteName: site.name,
      confirmationToken,
    });

    return { subscriber, confirmationSent: true };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { subscriber, confirmationSent: false };
  }
}

/**
 * Confirm a subscription using confirmation token
 */
export async function confirmSubscription(token: string): Promise<Subscriber | null> {
  const supabase = createAdminClient();

  // Find subscriber by token
  const { data: subscriber, error: findError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (findError || !subscriber) {
    console.error('Error finding subscriber:', findError);
    return null;
  }

  if (subscriber.is_confirmed) {
    // Already confirmed
    return subscriber;
  }

  // Update to confirmed
  const { data: updated, error: updateError } = await supabase
    .from('subscribers')
    .update({
      is_confirmed: true,
      confirmed_at: new Date().toISOString(),
      confirmation_token: null,
    })
    .eq('id', subscriber.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error confirming subscription:', updateError);
    return null;
  }

  return updated;
}

/**
 * Unsubscribe from a site using unsubscribe token
 */
export async function unsubscribe(token: string): Promise<Subscriber | null> {
  const supabase = createAdminClient();

  // Find subscriber by token
  const { data: subscriber, error: findError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (findError || !subscriber) {
    console.error('Error finding subscriber:', findError);
    return null;
  }

  if (subscriber.unsubscribed_at) {
    // Already unsubscribed
    return subscriber;
  }

  // Update to unsubscribed
  const { data: updated, error: updateError } = await supabase
    .from('subscribers')
    .update({
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error unsubscribing:', updateError);
    return null;
  }

  // Get site info for email
  const { data: site } = await supabase.from('sites').select('name').eq('id', subscriber.site_id).single();

  if (site) {
    // Send unsubscribe confirmation email
    try {
      await sendUnsubscribeConfirmation({
        to: subscriber.email,
        siteName: site.name,
      });
    } catch (error) {
      console.error('Error sending unsubscribe confirmation:', error);
    }
  }

  return updated;
}

/**
 * Get all confirmed subscribers for a site
 */
export async function getConfirmedSubscribers(siteId: string): Promise<Subscriber[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_confirmed', true)
    .is('unsubscribed_at', null);

  if (error) {
    console.error('Error fetching confirmed subscribers:', error);
    return [];
  }

  return data || [];
}

/**
 * Get subscriber count for a site
 */
export async function getSubscriberCount(siteId: string): Promise<{
  total: number;
  confirmed: number;
  unconfirmed: number;
  unsubscribed: number;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('subscribers')
    .select('is_confirmed, unsubscribed_at')
    .eq('site_id', siteId);

  if (error) {
    console.error('Error fetching subscriber counts:', error);
    return { total: 0, confirmed: 0, unconfirmed: 0, unsubscribed: 0 };
  }

  const total = data?.length || 0;
  const confirmed = data?.filter((s) => s.is_confirmed && !s.unsubscribed_at).length || 0;
  const unconfirmed = data?.filter((s) => !s.is_confirmed).length || 0;
  const unsubscribed = data?.filter((s) => s.unsubscribed_at).length || 0;

  return { total, confirmed, unconfirmed, unsubscribed };
}

/**
 * Check if an email is already subscribed to a site
 */
export async function isEmailSubscribed(siteId: string, email: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('site_id', siteId)
    .eq('email', email)
    .eq('is_confirmed', true)
    .maybeSingle();

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  return !!data;
}
