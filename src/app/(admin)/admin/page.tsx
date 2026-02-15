// Admin Overview — Main dashboard with platform statistics

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, requireAdmin } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import StatsGrid from '@/components/admin/StatsGrid';
import AlertCard from '@/components/admin/AlertCard';
import JobRow from '@/components/admin/JobRow';
import type { AdminAlert, JobLog, Organization, Site, Article } from '@/types/database';

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const adminSB = createAdminClient();

  // Fetch platform stats
  const [orgRes, sitesRes, articlesRes, subscribersRes, jobsRes, alertsRes] =
    await Promise.all([
      adminSB.from('organizations').select('id', { count: 'exact' }),
      adminSB.from('sites').select('id', { count: 'exact' }),
      adminSB.from('articles').select('id, published_at, view_count', { count: 'exact' }),
      adminSB.from('subscribers').select('id', { count: 'exact' }),
      adminSB.from('job_log').select('*').order('started_at', { ascending: false }).limit(10),
      adminSB.from('admin_alerts').select('*').eq('is_resolved', false).order('created_at', { ascending: false }).limit(10),
    ]);

  const orgCount = orgRes.count || 0;
  const siteCount = sitesRes.count || 0;
  const articleCount = articlesRes.count || 0;
  const subscriberCount = subscribersRes.count || 0;

  // Calculate articles published today, this week, this month
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

  let articlesToday = 0;
  let articlesWeek = 0;
  let articlesMonth = 0;

  if (articlesRes.data) {
    articlesRes.data.forEach((article) => {
      if (article.published_at) {
        const pubDate = new Date(article.published_at);
        if (pubDate >= today) articlesToday++;
        if (pubDate >= weekAgo) articlesWeek++;
        if (pubDate >= monthAgo) articlesMonth++;
      }
    });
  }

  // Calculate revenue (active subscriptions × $49/site)
  const subsRes = await adminSB
    .from('subscriptions')
    .select('quantity')
    .eq('status', 'active');

  let monthlyRevenue = 0;
  if (subsRes.data) {
    monthlyRevenue = subsRes.data.reduce((sum, sub) => sum + sub.quantity * 49, 0);
  }

  const stats = {
    totalOrganizations: orgCount,
    totalSites: siteCount,
    totalArticles: articleCount,
    totalSubscribers: subscriberCount,
    articlesToday,
    articlesWeek,
    articlesMonth,
    monthlyRevenue,
  };

  const jobs = (jobsRes.data || []) as JobLog[];
  const alerts = (alertsRes.data || []) as AdminAlert[];

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Admin Overview</h1>
        <p className="mt-2 text-slate-400">Platform-wide statistics and monitoring</p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Two column layout for alerts and jobs */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Alerts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Recent Alerts ({alerts.length})</h2>
          <div className="space-y-2">
            {alerts.length > 0 ? (
              alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            ) : (
              <p className="text-sm text-slate-400">No unresolved alerts</p>
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Recent Jobs ({jobs.length})</h2>
          <div className="space-y-2">
            {jobs.length > 0 ? (
              jobs.map((job) => <JobRow key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-slate-400">No recent jobs</p>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">System Health</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Database</p>
            <p className="mt-1 text-lg font-bold text-green-400">Healthy</p>
          </div>
          <div className="rounded bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Supabase Auth</p>
            <p className="mt-1 text-lg font-bold text-green-400">Active</p>
          </div>
          <div className="rounded bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Job Queue</p>
            <p className="mt-1 text-lg font-bold text-green-400">Running</p>
          </div>
          <div className="rounded bg-slate-800 p-3">
            <p className="text-xs text-slate-400">API Gateway</p>
            <p className="mt-1 text-lg font-bold text-green-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
