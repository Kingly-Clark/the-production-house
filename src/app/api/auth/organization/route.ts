import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user from users table
    let { data: user } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    // If user doesn't exist or has no org, try to find/create one
    if (!user?.organization_id) {
      // Check if there's an existing organization for this user's email
      const emailPrefix = session.user.email?.split('@')[0] || '';
      const { data: existingOrg } = await adminClient
        .from('organizations')
        .select('*')
        .ilike('name', `%${emailPrefix}%`)
        .limit(1)
        .single();

      if (existingOrg) {
        // Link user to existing org (create user if needed)
        await adminClient
          .from('users')
          .upsert({
            id: session.user.id,
            email: session.user.email || '',
            organization_id: existingOrg.id,
            role: 'client' as const,
            updated_at: new Date().toISOString(),
          });
        
        return NextResponse.json(existingOrg);
      }

      // No organization found - return 404 (user needs to create a site first)
      return NextResponse.json(
        { error: 'No organization found. Create a site to get started.' },
        { status: 404 }
      );
    }

    // Get organization
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
