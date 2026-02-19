import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { Organization, User } from '@/types/database';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper to get user record from users table (created by Supabase Auth trigger)
async function getUser(authUserId: string): Promise<User | null> {
  let adminClient;
  
  try {
    adminClient = createAdminClient();
  } catch (envError) {
    console.error('Admin client creation failed - missing SUPABASE_SERVICE_ROLE_KEY?', envError);
    throw new Error('Server configuration error - please contact support');
  }
  
  // Check if user exists in users table (should be created by auth trigger)
  const { data: existingUser, error: fetchError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // User not found - this is normal if trigger hasn't run yet
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user:', fetchError);
  }

  return null;
}

// Helper to get or create organization for user
async function getOrCreateOrganization(user: User | null, authUserId: string, userEmail: string): Promise<Organization> {
  const adminClient = createAdminClient();
  
  // 1. Check if user already has an organization_id in their record
  if (user?.organization_id) {
    const { data: org } = await adminClient
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single();
    
    if (org) {
      console.log('Found existing organization via user record:', org.id);
      return org;
    }
  }

  // 2. Check if user already has sites (to find their existing organization)
  const { data: existingSites } = await adminClient
    .from('sites')
    .select('organization_id')
    .limit(1);
  
  // Look for sites that belong to organizations that might be this user's
  // by checking the organizations table for matching email pattern
  const { data: existingOrgs } = await adminClient
    .from('organizations')
    .select('*')
    .ilike('name', `%${userEmail.split('@')[0]}%`)
    .limit(1);

  if (existingOrgs && existingOrgs.length > 0) {
    const existingOrg = existingOrgs[0];
    console.log('Found existing organization by name pattern:', existingOrg.id);
    
    // Link user to this existing organization
    if (user && !user.organization_id) {
      await adminClient
        .from('users')
        .update({ organization_id: existingOrg.id })
        .eq('id', user.id);
      console.log('Linked user to existing organization');
    }
    
    return existingOrg;
  }

  // 3. No existing organization found - create a new one
  console.log('Creating new organization for user:', authUserId);
  const { data: newOrg, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name: `${userEmail.split('@')[0]}'s Organization`,
      plan_status: 'active',
      max_sites: 3, // Default free tier
    })
    .select()
    .single();

  if (orgError || !newOrg) {
    console.error('Error creating organization - code:', orgError?.code, 'message:', orgError?.message);
    throw new Error(`Failed to create organization: ${orgError?.message || 'unknown error'}`);
  }

  // 4. Link user to the new organization
  if (user) {
    const { error: updateError } = await adminClient
      .from('users')
      .update({ organization_id: newOrg.id })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error linking user to organization:', updateError);
    } else {
      console.log('Linked user to new organization:', newOrg.id);
    }
  } else {
    // User record doesn't exist - create it
    console.log('Creating user record for:', authUserId);
    const { error: createUserError } = await adminClient
      .from('users')
      .insert({
        id: authUserId,
        email: userEmail,
        role: 'client',
        organization_id: newOrg.id,
      });
    
    if (createUserError) {
      console.error('Error creating user record:', createUserError);
    } else {
      console.log('Created user record with organization:', newOrg.id);
    }
  }

  return newOrg;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get session first (faster, reads from cookie)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Use session user
    const authUser = session.user;

    // Get user record from users table (created by Supabase Auth trigger)
    const user = await getUser(authUser.id);

    // Get or create organization
    const organization = await getOrCreateOrganization(user, authUser.id, authUser.email || '');

    // Get optional clientId filter from query params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Build query for sites
    let query = adminClient
      .from('sites')
      .select('*, clients(id, name)')
      .eq('organization_id', organization.id)
      .neq('status', 'deleted');

    // Filter by clientId if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: sites, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Flatten client info for easier frontend consumption
    const sitesWithClient = (sites || []).map(site => ({
      ...site,
      client_name: site.clients?.name || null,
      clients: undefined,
    }));

    return NextResponse.json(sitesWithClient);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get session first (faster, reads from cookie)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Use session user
    const authUser = session.user;

    // Get user record from users table (created by Supabase Auth trigger)
    const user = await getUser(authUser.id);

    // Get or create organization
    const organization = await getOrCreateOrganization(user, authUser.id, authUser.email || '');

    const body = await request.json();
    const { name, slug, description, header_text, template_id, tone_of_voice, client_id } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Determine which client to use
    let finalClientId = client_id;
    
    if (!finalClientId) {
      // Get or create a default client for this organization
      const { data: existingClients } = await adminClient
        .from('clients')
        .select('id')
        .eq('organization_id', organization.id)
        .limit(1);

      if (existingClients && existingClients.length > 0) {
        finalClientId = existingClients[0].id;
      } else {
        // Create a default client
        const { data: newClient } = await adminClient
          .from('clients')
          .insert({
            organization_id: organization.id,
            name: 'Default',
            description: 'Default client',
          })
          .select()
          .single();

        if (newClient) {
          finalClientId = newClient.id;
          
          // Add user as owner of this client
          if (user) {
            await adminClient
              .from('client_members')
              .insert({
                client_id: newClient.id,
                user_id: user.id,
                role: 'owner',
              });
          }
        }
      }
    } else {
      // Verify the client belongs to this organization
      const { data: clientCheck } = await adminClient
        .from('clients')
        .select('id')
        .eq('id', client_id)
        .eq('organization_id', organization.id)
        .single();

      if (!clientCheck) {
        return NextResponse.json(
          { error: 'Invalid client_id' },
          { status: 400 }
        );
      }
    }

    // Check if slug already exists and generate unique one if needed
    let finalSlug = slug;
    let slugExists = true;
    let attempts = 0;
    
    while (slugExists && attempts < 10) {
      const { data: existingSite } = await adminClient
        .from('sites')
        .select('id')
        .eq('slug', finalSlug)
        .single();
      
      if (existingSite) {
        // Append random suffix to make it unique
        const suffix = Math.random().toString(36).substring(2, 6);
        finalSlug = `${slug}-${suffix}`;
        attempts++;
      } else {
        slugExists = false;
      }
    }

    if (slugExists) {
      return NextResponse.json(
        { error: 'Could not generate unique slug. Please try a different name.' },
        { status: 400 }
      );
    }

    // Create the site (use admin client to bypass RLS)
    const { data: site, error: siteError } = await adminClient
      .from('sites')
      .insert({
        organization_id: organization.id,
        client_id: finalClientId || null,
        name,
        slug: finalSlug,
        description: description || null,
        header_text: header_text || null,
        template_id: template_id || 'classic',
        tone_of_voice: tone_of_voice || 'professional',
        status: 'building',
        articles_per_day: 5,
        cron_enabled: false,
      })
      .select()
      .single();

    if (siteError) {
      console.error('Error creating site:', siteError);
      throw new Error(`Failed to create site: ${siteError.message}`);
    }

    // Create default site settings (use admin client)
    const { error: settingsError } = await adminClient
      .from('site_settings')
      .insert({
        site_id: site.id,
        primary_color: '#3b82f6',
        secondary_color: '#1e293b',
        accent_color: '#0ea5e9',
        text_color: '#ffffff',
        background_color: '#0f172a',
        font_heading: 'Poppins',
        font_body: 'Inter',
        logo_url: null,
        favicon_url: null,
        custom_css: null,
        meta_title: name,
        meta_description: description || name,
        og_image_url: null,
        google_analytics_id: null,
      });

    if (settingsError) {
      console.error('Error creating site settings:', settingsError);
      throw new Error(`Failed to create site settings: ${settingsError.message}`);
    }

    // Create default backlink settings (use admin client)
    const { error: backlinkError } = await adminClient
      .from('backlink_settings')
      .insert({
        site_id: site.id,
        is_enabled: false,
        target_url: null,
        placement_type: 'inline' as const,
        banner_image_url: null,
        banner_text: null,
        link_text: 'Learn more',
        frequency: 5,
      });

    if (backlinkError) {
      console.error('Error creating backlink settings:', backlinkError);
      throw new Error(`Failed to create backlink settings: ${backlinkError.message}`);
    }

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
