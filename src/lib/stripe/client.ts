// Production House — Stripe Client
// Initializes Stripe SDK and exports price ID
// =============================================================

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('STRIPE_PRICE_ID environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
