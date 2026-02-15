// Production House — Public Unsubscribe API
// Endpoint for users to unsubscribe from newsletters
// No authentication required - uses token-based verification
// =============================================================

import { unsubscribe } from '@/lib/newsletter/subscribers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unsubscribe token is required' }, { status: 400 });
    }

    // Unsubscribe using token
    const subscriber = await unsubscribe(token);

    if (!subscriber) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe token' }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `You have been unsubscribed from the newsletter`,
      email: subscriber.email,
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
