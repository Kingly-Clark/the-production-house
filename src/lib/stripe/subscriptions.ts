// Production House — Stripe Subscription Management
// Handles subscription updates, cancellations, and portal access
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from './client';
import type { Subscription } from '@/types/database';

/**
 * Get current subscription details for an organization
 */
export async function getSubscription(organizationId: string): Promise<Subscription | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No subscription found
      return null;
    }
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }

  return data;
}

/**
 * Update subscription quantity (handles proration)
 */
export async function updateQuantity(organizationId: string, newQuantity: number): Promise<void> {
  if (newQuantity < 1) {
    throw new Error('Subscription quantity must be at least 1');
  }

  const admin = createAdminClient();

  // Get subscription
  const subscription = await getSubscription(organizationId);

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new Error('No active subscription found for this organization');
  }

  // Get Stripe subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripe_subscription_id
  );

  if (!stripeSubscription.items.data[0]) {
    throw new Error('Subscription has no items');
  }

  // Update subscription with proration
  const updatedSubscription = await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          quantity: newQuantity,
        },
      ],
      proration_behavior: 'create_prorations',
    }
  );

  // Update local database
  const { error } = await admin
    .from('subscriptions')
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to update subscription in database: ${error.message}`);
  }
}

/**
 * Cancel subscription (optionally at period end)
 */
export async function cancelSubscription(
  organizationId: string,
  atPeriodEnd: boolean = true
): Promise<void> {
  const admin = createAdminClient();

  // Get subscription
  const subscription = await getSubscription(organizationId);

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new Error('No active subscription found for this organization');
  }

  // Cancel on Stripe
  if (atPeriodEnd) {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } else {
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
  }

  // Update local database
  const { error } = await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: atPeriodEnd,
      status: atPeriodEnd ? 'active' : 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to update subscription in database: ${error.message}`);
  }

  // Update organization plan status
  const { error: orgError } = await admin
    .from('organizations')
    .update({
      plan_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (orgError) {
    console.error('Failed to update organization status:', orgError);
  }
}

/**
 * Resume a subscription that was marked for cancellation
 */
export async function resumeSubscription(organizationId: string): Promise<void> {
  const admin = createAdminClient();

  // Get subscription
  const subscription = await getSubscription(organizationId);

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new Error('No subscription found for this organization');
  }

  // Resume on Stripe
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  // Update local database
  const { error } = await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to update subscription in database: ${error.message}`);
  }

  // Update organization plan status
  const { error: orgError } = await admin
    .from('organizations')
    .update({
      plan_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (orgError) {
    console.error('Failed to update organization status:', orgError);
  }
}

/**
 * Create Stripe customer portal session
 */
export async function createCustomerPortalSession(
  organizationId: string,
  returnUrl: string
): Promise<string> {
  const admin = createAdminClient();

  // Get organization with Stripe customer ID
  const { data: org, error } = await admin
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', organizationId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch organization: ${error.message}`);
  }

  if (!org.stripe_customer_id) {
    throw new Error('Organization does not have a Stripe customer ID');
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: returnUrl,
  });

  return session.url;
}
