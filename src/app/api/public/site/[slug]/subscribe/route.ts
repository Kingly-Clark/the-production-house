import { createAdminClient } from '@/lib/supabase/admin';
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
    const supabase = createAdminClient();

    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address required' },
        { status: 400 }
      );
    }

    // Get site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
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
      // If they unsubscribed, don't re-subscribe automatically
      if (existingSubscriber.unsubscribed_at) {
        return NextResponse.json(
          { error: 'You have previously unsubscribed from this newsletter.' },
          { status: 400 }
        );
      }
      // Already active
      return NextResponse.json(
        { message: 'You are already subscribed!' },
        { status: 200 }
      );
    }

    // Create new subscriber — immediately active, no confirmation needed
    const unsubscribeToken = generateToken();
    const now = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        site_id: site.id,
        email: email.toLowerCase(),
        is_confirmed: true,
        confirmed_at: now,
        confirmation_token: null,
        unsubscribe_token: unsubscribeToken,
        subscribed_at: now,
      });

    if (insertError) {
      console.error('Subscriber insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Create notification for site owner
    try {
      // Find the user who owns this site's organization
      const { data: orgUsers } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', site.organization_id)
        .limit(1);

      if (orgUsers && orgUsers.length > 0) {
        await supabase.from('notifications').insert({
          user_id: orgUsers[0].id,
          type: 'new_subscriber',
          title: 'New subscriber',
          message: `${email.toLowerCase()} subscribed to ${site.name}`,
          is_read: false,
          link: `/dashboard/sites/${site.id}/subscribers`,
          created_at: now,
        });
      }
    } catch {
      // Non-critical — don't fail the subscription
    }

    return NextResponse.json(
      { message: "You're subscribed!" },
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
