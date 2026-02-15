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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Verify access to site
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

    // Build query
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId);

    if (status && status !== 'all') {
      query = query.eq('status', status as any);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Execute query
    const { data: articles, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      articles: articles || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching articles:', error);
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
    const { site_id, original_title, original_url, original_content } = body;

    if (!site_id || !original_title || !original_url) {
      return NextResponse.json(
        { error: 'site_id, original_title, and original_url are required' },
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

    // Create article
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        site_id,
        original_title,
        original_url,
        original_content: original_content || null,
        status: 'raw',
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
