// Production House — Remove Site API
// Deletes a site and decrements subscription quantity
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
    const { siteId } = body as {
      siteId?: unknown;
    };

    // Validate siteId
    if (typeof siteId !== 'string' || !siteId.trim()) {
      return NextResponse.json(
        { error: 'Site ID is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify site belongs to organization
    const { data: site, error: siteError } = await admin
      .from('sites')
      .select('id, organization_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.organization_id !== organization.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this site' },
        { status: 403 }
      );
    }

    // Mark site as deleted
    const { error: updateSiteError } = await admin
      .from('sites')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateSiteError) {
      throw new Error(`Failed to delete site: ${updateSiteError.message}`);
    }

    // Count remaining active sites
    const { data: activeSites, error: activeSitesError } = await admin
      .from('sites')
      .select('id')
      .eq('organization_id', organization.id)
      .neq('status', 'deleted');

    if (activeSitesError) {
      throw new Error(`Failed to count active sites: ${activeSitesError.message}`);
    }

    const remainingCount = activeSites?.length || 0;

    // Update subscription quantity if needed
    if (remainingCount > 0 && remainingCount < organization.max_sites) {
      try {
        await updateQuantity(organization.id, remainingCount);

        // Update organization max_sites
        const { error: updateOrgError } = await admin
          .from('organizations')
          .update({
            max_sites: remainingCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organization.id);

        if (updateOrgError) {
          console.error('Failed to update organization max_sites:', updateOrgError);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to update subscription quantity:', message);
        // Don't fail the entire request if subscription update fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Remove site error:', error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
