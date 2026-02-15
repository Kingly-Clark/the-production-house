import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getUserOrganization } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';
import { Database, Site } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user and organization
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await getUserOrganization(supabase);

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

    // Get current user and organization
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await getUserOrganization(supabase);

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
