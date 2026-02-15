// Production House — Billing Info API
// Returns organization, subscription, and sites info
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getUserOrganization } from '@/lib/auth/helpers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user || !user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated or has no organization' },
        { status: 401 }
      );
    }

    // Get organization
    const organization = await getUserOrganization(supabase);

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch subscription: ${subError.message}`);
    }

    // Get sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (sitesError) {
      throw new Error(`Failed to fetch sites: ${sitesError.message}`);
    }

    return NextResponse.json({
      organization,
      subscription: subscription || null,
      sites: sites || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Billing info error:', error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
