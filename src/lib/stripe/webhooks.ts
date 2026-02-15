// Production House — Stripe Webhook Handler
// Processes Stripe events and syncs to local database
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from './client';
import type Stripe from 'stripe';

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret);
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const admin = createAdminClient();

  if (event.type !== 'checkout.session.completed') {
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (!session.metadata?.organization_id) {
    console.warn('Checkout session has no organization_id');
    return;
  }

  if (!session.subscription) {
    console.warn('Checkout session has no subscription');
    return;
  }

  const organizationId = session.metadata.organization_id as string;
  const subscriptionId = session.subscription as string;

  // Get Stripe subscription to extract details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const quantity = subscription.items.data[0]?.quantity || 1;
  const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  // Get or create organization
  const { data: existingOrg } = await admin
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single();

  if (!existingOrg) {
    // Create new organization
    const { error: createOrgError } = await admin.from('organizations').insert({
      id: organizationId,
      name: session.customer_details?.name || 'New Organization',
      stripe_customer_id: session.customer as string,
      plan_status: 'active',
      max_sites: quantity,
      brand_colors: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (createOrgError) {
      console.error('Failed to create organization:', createOrgError);
      throw createOrgError;
    }
  } else {
    // Update existing organization
    const { error: updateOrgError } = await admin
      .from('organizations')
      .update({
        max_sites: quantity,
        plan_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateOrgError) {
      console.error('Failed to update organization:', updateOrgError);
    }
  }

  // Check if subscription already exists
  const { data: existingSubscription } = await admin
    .from('subscriptions')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if (!existingSubscription) {
    // Create new subscription record
    const { error: createSubError } = await admin.from('subscriptions').insert({
      organization_id: organizationId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status as any,
      quantity,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (createSubError) {
      console.error('Failed to create subscription:', createSubError);
      throw createSubError;
    }
  } else {
    // Update subscription record
    const { error: updateSubError } = await admin
      .from('subscriptions')
      .update({
        status: subscription.status as any,
        quantity,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);

    if (updateSubError) {
      console.error('Failed to update subscription:', updateSubError);
    }
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  if (event.type !== 'customer.subscription.updated') {
    return;
  }

  const subscription = event.data.object as Stripe.Subscription;
  const admin = createAdminClient();

  // Find organization by Stripe subscription ID
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subError) {
    console.warn('Subscription not found in database:', subscription.id);
    return;
  }

  const quantity = subscription.items.data[0]?.quantity || 1;
  const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  // Update subscription
  const { error: updateError } = await admin
    .from('subscriptions')
    .update({
      status: subscription.status as any,
      quantity,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('Failed to update subscription:', updateError);
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  if (event.type !== 'customer.subscription.deleted') {
    return;
  }

  const subscription = event.data.object as Stripe.Subscription;
  const admin = createAdminClient();

  // Find organization by subscription ID
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subError) {
    console.warn('Subscription not found in database:', subscription.id);
    return;
  }

  const organizationId = sub.organization_id;

  // Update subscription status
  const { error: updateSubError } = await admin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateSubError) {
    console.error('Failed to update subscription:', updateSubError);
  }

  // Update organization status
  const { error: updateOrgError } = await admin
    .from('organizations')
    .update({
      plan_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (updateOrgError) {
    console.error('Failed to update organization:', updateOrgError);
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
  if (event.type !== 'invoice.payment_succeeded') {
    return;
  }

  const invoice = event.data.object as Stripe.Invoice;
  const admin = createAdminClient();

  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    console.warn('Invoice has no subscription');
    return;
  }

  // Find organization by subscription ID
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', subscriptionId as string)
    .single();

  if (subError) {
    console.warn('Subscription not found in database:', (invoice as any).subscription);
    return;
  }

  // Update organization plan status to active
  const { error: updateError } = await admin
    .from('organizations')
    .update({
      plan_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.organization_id);

  if (updateError) {
    console.error('Failed to update organization:', updateError);
  }
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(event: Stripe.Event): Promise<void> {
  if (event.type !== 'invoice.payment_failed') {
    return;
  }

  const invoice = event.data.object as Stripe.Invoice;
  const admin = createAdminClient();

  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    console.warn('Invoice has no subscription');
    return;
  }

  // Find organization by subscription ID
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', subscriptionId as string)
    .single();

  if (subError) {
    console.warn('Subscription not found in database:', (invoice as any).subscription);
    return;
  }

  const organizationId = sub.organization_id;

  // Update organization plan status to past_due
  const { error: updateOrgError } = await admin
    .from('organizations')
    .update({
      plan_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (updateOrgError) {
    console.error('Failed to update organization:', updateOrgError);
  }

  // Create admin alert
  const { error: alertError } = await admin.from('admin_alerts').insert({
    type: 'payment_failed',
    severity: 'critical',
    message: `Payment failed for organization ${organizationId}`,
    details: {
      organization_id: organizationId,
      invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
    },
    organization_id: organizationId,
    is_resolved: false,
    created_at: new Date().toISOString(),
  });

  if (alertError) {
    console.error('Failed to create admin alert:', alertError);
  }
}

/**
 * Main event handler
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event);
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}
