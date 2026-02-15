// Admin API: Sites
// GET: List all sites with organization info

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Fetch all sites with organization info
    const sitesRes = await adminSB.from('sites').select('*');

    if (!sitesRes.data) {
      return Response.json([]);
    }

    const sitesWithOrgs = await Promise.all(
      sitesRes.data.map(async (site: any) => {
        // Get organization name
        const orgRes = await adminSB
          .from('organizations')
          .select('name')
          .eq('id', site.organization_id)
          .single();

        // Get article count
        const articlesRes = await adminSB
          .from('articles')
          .select('id, updated_at', { count: 'exact' })
          .eq('site_id', site.id);

        // Get most recent article update for last_activity
        let lastActivity = site.updated_at;
        if (articlesRes.data && articlesRes.data.length > 0) {
          const sorted = articlesRes.data.sort(
            (a: any, b: any) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          lastActivity = sorted[0].updated_at;
        }

        return {
          id: site.id,
          name: site.name,
          org_name: orgRes.data?.name || 'Unknown',
          template_id: site.template_id,
          status: site.status,
          article_count: articlesRes.count || 0,
          last_activity: lastActivity,
        };
      })
    );

    return Response.json(sitesWithOrgs);
  } catch (error) {
    console.error('Failed to fetch sites:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
