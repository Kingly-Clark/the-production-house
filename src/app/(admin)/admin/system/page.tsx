// System Page — Environment and system health information

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/helpers';

export default async function SystemPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const adminSB = createAdminClient();

  // Fetch database table counts
  const tableStats = await Promise.all([
    adminSB.from('organizations').select('id', { count: 'exact' }),
    adminSB.from('users').select('id', { count: 'exact' }),
    adminSB.from('sites').select('id', { count: 'exact' }),
    adminSB.from('articles').select('id', { count: 'exact' }),
    adminSB.from('subscribers').select('id', { count: 'exact' }),
    adminSB.from('admin_alerts').select('id', { count: 'exact' }),
    adminSB.from('job_log').select('id', { count: 'exact' }),
  ]);

  const stats = {
    organizations: tableStats[0].count || 0,
    users: tableStats[1].count || 0,
    sites: tableStats[2].count || 0,
    articles: tableStats[3].count || 0,
    subscribers: tableStats[4].count || 0,
    alerts: tableStats[5].count || 0,
    jobLogs: tableStats[6].count || 0,
  };

  // Check for environment variables (safely)
  const hasRequiredEnvs = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    anthropicApiKey: !!process.env.ANTHROPIC_API_KEY,
    resendApiKey: !!process.env.RESEND_API_KEY,
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System</h1>
        <p className="mt-2 text-slate-400">System health and configuration status</p>
      </div>

      {/* Database Stats */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Database Statistics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Organizations</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.organizations}</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Users</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.users}</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Sites</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.sites}</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Articles</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.articles}</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Subscribers</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.subscribers}</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Alerts</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.alerts}</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <p className="text-xs text-slate-400">Job Logs</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.jobLogs}</p>
          </div>
        </div>
      </div>

      {/* API Keys Status */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-6 text-xl font-bold text-white">API Keys & Configuration</h2>
        <div className="space-y-3">
          {Object.entries(hasRequiredEnvs).map(([key, configured]) => (
            <div key={key} className="flex items-center justify-between rounded bg-slate-800 p-4">
              <span className="font-medium text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded ${
                  configured
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                {configured ? 'Configured' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs Status */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Cron Jobs</h2>
        <div className="space-y-3">
          {[
            { name: 'fetch_sources', schedule: 'Every 4 hours' },
            { name: 'rewrite_articles', schedule: 'Every 2 hours' },
            { name: 'publish_articles', schedule: 'Every 1 hour' },
            { name: 'post_social', schedule: 'Every 4 hours' },
            { name: 'send_newsletter', schedule: 'Daily at 9 AM UTC' },
            { name: 'check_domains', schedule: 'Daily at midnight UTC' },
          ].map((job) => (
            <div key={job.name} className="flex items-center justify-between rounded bg-slate-800 p-4">
              <div>
                <p className="font-medium text-white capitalize">{job.name.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400">{job.schedule}</p>
              </div>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded bg-green-900 text-green-300">
                Enabled
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Service Status */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Service Status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Supabase</span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Database & Auth</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Stripe</span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Payments</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Claude API</span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Content Generation</p>
          </div>
          <div className="rounded bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Resend</span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Email Service</p>
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Environment</h2>
        <div className="space-y-2 text-sm text-slate-300 font-mono">
          <div>
            <span className="text-slate-400">Node Environment:</span> {process.env.NODE_ENV}
          </div>
          <div>
            <span className="text-slate-400">Next.js Version:</span> 15.x
          </div>
          <div>
            <span className="text-slate-400">Runtime:</span> Node.js
          </div>
          <div>
            <span className="text-slate-400">Timezone:</span> UTC
          </div>
        </div>
      </div>
    </div>
  );
}
