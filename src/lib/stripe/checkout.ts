// Production House — Stripe Checkout
// Creates checkout sessions for subscriptions
// =============================================================

import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, STRIPE_PRICE_ID } from './client';
import type { Database, Organization } from '@/types/database';

export interface CreateCheckoutSessionParams {
  organizationId: string;
  quantity: number;
  email: string;
  successUrl: string;
  cancelUrl: string;
  coupon?: string;
}

/**
 * Create or retrieve Stripe customer for organization
 */
async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string
): Promise<string> {
  const admin = createAdminClient();

  // Get organization
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', organizationId)
    .single();

  if (orgError) {
    throw new Error(`Failed to fetch organization: ${orgError.message}`);
  }

  // If customer already exists, return the ID
  if (org.stripe_customer_id) {
    return org.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: org.name,
    metadata: {
      organization_id: organizationId,
    },
  });

  // Update organization with Stripe customer ID
  const { error: updateError } = await admin
    .from('organizations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', organizationId);

  if (updateError) {
    console.error('Failed to update organization with Stripe customer ID:', updateError);
  }

  return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<string> {
  const { organizationId, quantity, email, successUrl, cancelUrl, coupon } = params;

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(organizationId, email);

  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: STRIPE_PRICE_ID,
      quantity,
    },
  ];

  // Build session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organization_id: organizationId,
    },
  };

  // Add coupon if provided
  if (coupon) {
    sessionParams.discounts = [
      {
        coupon,
      },
    ];
  }

  // Create session
  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Failed to create checkout session: no URL returned');
  }

  return session.url;
}
