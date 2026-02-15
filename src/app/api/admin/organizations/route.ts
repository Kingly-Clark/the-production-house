// Admin API: Organizations
// GET: List all organizations with stats

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

// Force dynamic rendering - this route uses runtime env vars
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Fetch all organizations
    const orgsRes = await adminSB.from('organizations').select('*');

    if (!orgsRes.data) {
      return Response.json([]);
    }

    // Get site counts for each organization
    const orgsWithStats = await Promise.all(
      orgsRes.data.map(async (org: any) => {
        const sitesRes = await adminSB
          .from('sites')
          .select('id', { count: 'exact' })
          .eq('organization_id', org.id);

        return {
          id: org.id,
          name: org.name,
          website_url: org.website_url,
          plan_status: org.plan_status,
          site_count: sitesRes.count || 0,
          created_at: org.created_at,
        };
      })
    );

    return Response.json(orgsWithStats);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
