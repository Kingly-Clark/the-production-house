// Admin API: Platform Statistics
// GET: Fetch platform-wide statistics

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Fetch all counts
    const [orgs, sites, articles, subscribers, activeSubsRes, alertsRes, jobsRes] =
      await Promise.all([
        adminSB.from('organizations').select('id', { count: 'exact' }),
        adminSB.from('sites').select('id', { count: 'exact' }),
        adminSB.from('articles').select('id, published_at', { count: 'exact' }),
        adminSB.from('subscribers').select('id', { count: 'exact' }),
        adminSB.from('subscriptions').select('quantity').eq('status', 'active'),
        adminSB.from('admin_alerts').select('id').eq('is_resolved', false),
        adminSB.from('job_log').select('id, status'),
      ]);

    // Calculate articles published today, this week, this month
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    let articlesToday = 0;
    let articlesWeek = 0;
    let articlesMonth = 0;

    if (articles.data) {
      articles.data.forEach((article: any) => {
        if (article.published_at) {
          const pubDate = new Date(article.published_at);
          if (pubDate >= today) articlesToday++;
          if (pubDate >= weekAgo) articlesWeek++;
          if (pubDate >= monthAgo) articlesMonth++;
        }
      });
    }

    // Calculate revenue
    let monthlyRevenue = 0;
    if (activeSubsRes.data) {
      monthlyRevenue = activeSubsRes.data.reduce((sum, sub) => sum + sub.quantity * 49, 0);
    }

    // Job stats
    let runningJobs = 0;
    let failedJobs = 0;
    if (jobsRes.data) {
      jobsRes.data.forEach((job: any) => {
        if (job.status === 'running') runningJobs++;
        if (job.status === 'failed') failedJobs++;
      });
    }

    return Response.json({
      organizations: orgs.count || 0,
      sites: sites.count || 0,
      articles: articles.count || 0,
      subscribers: subscribers.count || 0,
      articlesToday,
      articlesWeek,
      articlesMonth,
      monthlyRevenue,
      unresolvedAlerts: alertsRes.count || 0,
      runningJobs,
      failedJobs,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
