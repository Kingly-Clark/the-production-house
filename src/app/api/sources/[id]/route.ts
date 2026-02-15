import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

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
    const { data: source, error: fetchError } = await supabase
      .from('sources')
      .select('site_id')
      .eq('id', id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', source.site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update source
    const { data: updated, error } = await supabase
      .from('sources')
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
    console.error('Error updating source:', error);
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
    const { data: source, error: fetchError } = await supabase
      .from('sources')
      .select('site_id')
      .eq('id', id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', source.site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete source
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
