import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(accounts || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching social accounts:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { site_id, platform } = body;

    if (!site_id || !platform) {
      return NextResponse.json(
        { error: 'site_id and platform are required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate OAuth URL based on platform
    // This is a stub - actual OAuth implementation would be more complex
    const authUrls: Record<string, string> = {
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      x: 'https://twitter.com/i/oauth2/authorize',
      instagram: 'https://api.instagram.com/oauth/authorize',
      tiktok: 'https://www.tiktok.com/v1/oauth/authorize',
    };

    return NextResponse.json({
      auth_url: authUrls[platform] || '/',
      platform,
      site_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error initiating social connection:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
