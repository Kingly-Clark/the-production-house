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
  
  // Check if user already has an organization
  if (user?.organization_id) {
    const { data: org } = await adminClient
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single();
    
    if (org) return org;
  }

  // Create a new organization for the user
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

  // Link user to the organization (if user record exists)
  if (user) {
    const { error: updateError } = await adminClient
      .from('users')
      .update({ organization_id: newOrg.id })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error linking user to organization:', updateError);
    }
  } else {
    // User record doesn't exist yet - try to create minimal record
    // or just log it for now (the auth trigger should handle this)
    console.log('User record not found for', authUserId, '- org created but not linked');
  }

  return newOrg;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Fetch all sites for this organization
    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(sites || []);
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
    const { name, slug, description, header_text, template_id, tone_of_voice } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Create the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        organization_id: organization.id,
        name,
        slug,
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
      throw siteError;
    }

    // Create default site settings
    const { error: settingsError } = await supabase
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
      throw settingsError;
    }

    // Create default backlink settings
    const { error: backlinkError } = await supabase
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
      throw backlinkError;
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
