// Production House — Billing Checkout API
// Creates Stripe checkout session for subscription
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user || !user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated or has no organization' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { quantity, coupon } = body as {
      quantity?: unknown;
      coupon?: unknown;
    };

    // Validate quantity
    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be a number greater than 0' },
        { status: 400 }
      );
    }

    // Validate coupon if provided
    if (coupon !== undefined && typeof coupon !== 'string') {
      return NextResponse.json(
        { error: 'Coupon must be a string' },
        { status: 400 }
      );
    }

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create checkout session
    const url = await createCheckoutSession({
      organizationId: user.organization_id,
      quantity,
      email: user.email,
      successUrl: `${appUrl}/dashboard/billing?success=true`,
      cancelUrl: `${appUrl}/dashboard/billing?cancelled=true`,
      coupon,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Checkout error:', error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
