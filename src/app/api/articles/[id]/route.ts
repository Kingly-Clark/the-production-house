import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch article with site info
    const { data: article, error } = await supabase
      .from('articles')
      .select('*, sites(organization_id)')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Verify access
    const site = (article as any).sites;
    if (site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify access
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('site_id')
      .eq('id', id)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', article.site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update article
    const { data: updated, error } = await supabase
      .from('articles')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify access
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('site_id')
      .eq('id', id)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', article.site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft-delete: mark as deleted so it won't be re-scraped
    const { error } = await supabase
      .from('articles')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
