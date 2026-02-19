import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

  return { user, session };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const result = await getUserWithOrganization(supabase);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result;

    const { data: clients, error } = await adminClient
      .from('clients')
      .select('*, sites:sites(count)')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const clientsWithSiteCount = (clients || []).map(client => ({
      ...client,
      site_count: client.sites?.[0]?.count || 0,
      sites: undefined,
    }));

    return NextResponse.json(clientsWithSiteCount);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const result = await getUserWithOrganization(supabase);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result;

    const body = await request.json();
    const { name, description, logo_url, website_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: client, error: clientError } = await adminClient
      .from('clients')
      .insert({
        organization_id: user.organization_id,
        name,
        description: description || null,
        logo_url: logo_url || null,
        website_url: website_url || null,
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      throw new Error(`Failed to create client: ${clientError.message}`);
    }

    const { error: memberError } = await adminClient
      .from('client_members')
      .insert({
        client_id: client.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding client member:', memberError);
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating client:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
