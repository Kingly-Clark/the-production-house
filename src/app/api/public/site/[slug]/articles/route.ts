import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const categorySlug = searchParams.get('category');
    const pageSize = parseInt(searchParams.get('limit') || '12');

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

    // Get category if specified
    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('site_id', site.id)
        .eq('slug', categorySlug)
        .single();

      if (category) {
        categoryId = category.id;
      }
    }

    // Build query
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('site_id', site.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Get paginated results
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: articles = [], count = 0 } = await query.range(from, to);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        pageSize,
        total: count,
        pages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
