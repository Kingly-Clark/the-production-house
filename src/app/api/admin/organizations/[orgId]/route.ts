// Admin API: Organization Detail
// GET: Get organization details
// PATCH: Update organization

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

interface RequestParams {
  params: Promise<{ orgId: string }>;
}

export async function GET(_request: Request, { params }: RequestParams) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    const orgRes = await adminSB
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgRes.error || !orgRes.data) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    return Response.json(orgRes.data);
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: RequestParams) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();
    const body = await request.json();

    // Only allow updating certain fields
    const updateData = {
      name: body.name,
      website_url: body.website_url,
      brand_summary: body.brand_summary,
      plan_status: body.plan_status,
    };

    const updateRes = await adminSB
      .from('organizations')
      .update(updateData)
      .eq('id', orgId)
      .select()
      .single();

    if (updateRes.error) {
      return Response.json({ error: updateRes.error.message }, { status: 400 });
    }

    return Response.json(updateRes.data);
  } catch (error) {
    console.error('Failed to update organization:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
