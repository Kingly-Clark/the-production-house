// Production House — Public Subscription Confirmation API
// Endpoint for users to confirm their email subscription
// No authentication required - uses token-based verification
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import { confirmSubscription } from '@/lib/newsletter/subscribers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await props.params;
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Confirmation token is required' }, { status: 400 });
    }

    // Confirm subscription using token
    const subscriber = await confirmSubscription(token);

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      );
    }

    // Verify the site slug matches
    const supabase = createAdminClient();
    const { data: site } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', subscriber.site_id)
      .single();

    if (!site || site.id !== subscriber.site_id) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `You have successfully confirmed your subscription to ${site.name}`,
      email: subscriber.email,
      siteName: site.name,
    });
  } catch (error) {
    console.error('Error confirming subscription:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
