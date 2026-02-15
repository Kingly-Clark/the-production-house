// Admin API: Articles
// GET: List all articles across all sites

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Get limit from query params
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // Fetch recent articles
    const articlesRes = await adminSB
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!articlesRes.data) {
      return Response.json([]);
    }

    // Get site names for each article
    const articlesWithSites = await Promise.all(
      articlesRes.data.map(async (article: any) => {
        const siteRes = await adminSB
          .from('sites')
          .select('name')
          .eq('id', article.site_id)
          .single();

        return {
          id: article.id,
          title: article.title || article.original_title,
          site_name: siteRes.data?.name || 'Unknown',
          status: article.status,
          published_at: article.published_at,
          view_count: article.view_count,
        };
      })
    );

    return Response.json(articlesWithSites);
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
