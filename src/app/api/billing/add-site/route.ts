// Production House — Add Site API
// Creates a new site and increments subscription if needed
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, getUserOrganization } from '@/lib/auth/helpers';
import { updateQuantity } from '@/lib/stripe/subscriptions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user and organization
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user || !user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated or has no organization' },
        { status: 401 }
      );
    }

    const organization = await getUserOrganization(supabase);

    // Parse request body
    const body = await request.json();
    const { siteName, slug } = body as {
      siteName?: unknown;
      slug?: unknown;
    };

    // Validate inputs
    if (typeof siteName !== 'string' || !siteName.trim()) {
      return NextResponse.json(
        { error: 'Site name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof slug !== 'string' || !slug.trim()) {
      return NextResponse.json(
        { error: 'Slug is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Count current non-deleted sites
    const { data: sites, error: sitesError } = await admin
      .from('sites')
      .select('id')
      .eq('organization_id', organization.id)
      .neq('status', 'deleted');

    if (sitesError) {
      throw new Error(`Failed to fetch sites: ${sitesError.message}`);
    }

    const currentSiteCount = sites?.length || 0;

    // Check if we need to increment subscription
    if (currentSiteCount >= organization.max_sites) {
      try {
        // Increment subscription quantity
        const newQuantity = currentSiteCount + 1;
        await updateQuantity(organization.id, newQuantity);

        // Update organization max_sites
        const { error: updateOrgError } = await admin
          .from('organizations')
          .update({
            max_sites: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organization.id);

        if (updateOrgError) {
          console.error('Failed to update organization max_sites:', updateOrgError);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { error: `Failed to increment subscription: ${message}` },
          { status: 400 }
        );
      }
    }

    // Create the site
    const { data: newSite, error: createSiteError } = await admin
      .from('sites')
      .insert({
        organization_id: organization.id,
        name: siteName.trim(),
        slug: slug.trim(),
        template_id: 'classic',
        tone_of_voice: 'professional',
        status: 'active',
        articles_per_day: 5,
        cron_enabled: false,
      })
      .select()
      .single();

    if (createSiteError) {
      throw new Error(`Failed to create site: ${createSiteError.message}`);
    }

    // Create default site settings
    const { error: settingsError } = await admin.from('site_settings').insert({
      site_id: newSite.id,
      primary_color: '#000000',
      secondary_color: '#ffffff',
      accent_color: '#007bff',
      text_color: '#000000',
      background_color: '#ffffff',
      font_heading: 'system-ui, -apple-system, sans-serif',
      font_body: 'system-ui, -apple-system, sans-serif',
    });

    if (settingsError) {
      console.error('Failed to create site settings:', settingsError);
    }

    return NextResponse.json(newSite, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Add site error:', error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
