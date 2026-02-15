import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();

    // Get request body
    const body = await request.json();
    const { email } = body as { email?: string };

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address required' },
        { status: 400 }
      );
    }

    // Get site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('slug', slug)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check if subscriber already exists
    const { data: existingSubscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('site_id', site.id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingSubscriber) {
      if (existingSubscriber.is_confirmed) {
        return NextResponse.json(
          { message: 'Already subscribed!' },
          { status: 200 }
        );
      }
      // If not confirmed, update confirmation token
      const newToken = generateToken();
      await supabase
        .from('subscribers')
        .update({
          confirmation_token: newToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscriber.id);

      return NextResponse.json(
        { message: 'Confirmation email sent!' },
        { status: 200 }
      );
    }

    // Create new subscriber
    const confirmationToken = generateToken();
    const unsubscribeToken = generateToken();

    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        site_id: site.id,
        email: email.toLowerCase(),
        is_confirmed: false,
        confirmation_token: confirmationToken,
        unsubscribe_token: unsubscribeToken,
        subscribed_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email here
    // await sendConfirmationEmail(email, confirmationToken);

    return NextResponse.json(
      { message: 'Check your email to confirm your subscription!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
