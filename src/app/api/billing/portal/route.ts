// Production House — Billing Portal API
// Creates Stripe customer portal session
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe/subscriptions';
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

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/dashboard/billing`;

    // Create portal session
    const url = await createCustomerPortalSession(user.organization_id, returnUrl);

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Portal error:', error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
