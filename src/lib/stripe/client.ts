// Production House — Stripe Client
// Initializes Stripe SDK and exports price ID
// =============================================================

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

export function getStripePriceId(): string {
  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID environment variable is required');
  }
  return process.env.STRIPE_PRICE_ID;
}

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? '';
