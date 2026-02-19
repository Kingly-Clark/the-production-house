import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

async function getUserWithOrganization(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return { error: 'Unauthorized - Please log in', status: 401 };
  }

  const adminClient = createAdminClient();
  const { data: user, error: userError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (userError || !user) {
    return { error: 'User not found', status: 404 };
  }

  if (!user.organization_id) {
    return { error: 'User has no organization', status: 400 };
  }

  return { user: { ...user, organization_id: user.organization_id }, session };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const result = await getUserWithOrganization(supabase);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result;

    const { data: client, error } = await adminClient
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const result = await getUserWithOrganization(supabase);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result;

    const { data: existingClient } = await adminClient
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, logo_url, website_url } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (website_url !== undefined) updateData.website_url = website_url;

    const { data: updated, error } = await adminClient
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating client:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const result = await getUserWithOrganization(supabase);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result;

    const { data: existingClient } = await adminClient
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { data: clientCount } = await adminClient
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('organization_id', user.organization_id);

    if (clientCount && clientCount.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last client. You must have at least one client.' },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
