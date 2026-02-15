// Organization Detail — Individual organization view with management

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/helpers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Organization, Site, User, Subscription } from '@/types/database';

interface Props {
  params: Promise<{ orgId: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();
  await requireAdmin(supabase);
  const adminSB = createAdminClient();

  // Fetch organization details
  const [orgRes, sitesRes, usersRes, subsRes] = await Promise.all([
    adminSB.from('organizations').select('*').eq('id', orgId).single(),
    adminSB.from('sites').select('*').eq('organization_id', orgId),
    adminSB.from('users').select('*').eq('organization_id', orgId),
    adminSB.from('subscriptions').select('*').eq('organization_id', orgId).single(),
  ]);

  if (orgRes.error || !orgRes.data) {
    notFound();
  }

  const org = orgRes.data as Organization;
  const sites = (sitesRes.data || []) as Site[];
  const users = (usersRes.data || []) as User[];
  const subscription = subsRes.data as Subscription | null;

  // Get article stats for each site
  const siteStats = await Promise.all(
    sites.map(async (site) => {
      const [articleRes, subRes] = await Promise.all([
        adminSB.from('articles').select('id, status', { count: 'exact' }).eq('site_id', site.id),
        adminSB.from('subscribers').select('id', { count: 'exact' }).eq('site_id', site.id),
      ]);

      const statusCounts = {
        published: 0,
        pending: 0,
        raw: 0,
      };

      articleRes.data?.forEach((article: any) => {
        if (article.status === 'published') statusCounts.published++;
        else if (article.status === 'pending') statusCounts.pending++;
        else if (article.status === 'raw') statusCounts.raw++;
      });

      return {
        site,
        articleCount: articleRes.count || 0,
        subscriberCount: subRes.count || 0,
        statusCounts,
      };
    })
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const monthlyRevenue = subscription?.quantity ? subscription.quantity * 49 : 0;

  return (
    <div className="space-y-8 p-8">
      {/* Back button */}
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Organizations
      </Link>

      {/* Organization Header */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
            {org.website_url && (
              <a
                href={org.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm text-amber-400 hover:text-amber-300"
              >
                {org.website_url}
              </a>
            )}
            {org.brand_summary && (
              <p className="mt-4 text-sm text-slate-300">{org.brand_summary}</p>
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400">Plan Status</p>
              <p className="font-semibold text-white capitalize">{org.plan_status}</p>
            </div>
            <div>
              <p className="text-slate-400">Max Sites</p>
              <p className="font-semibold text-white">{org.max_sites}</p>
            </div>
            <div>
              <p className="text-slate-400">Created</p>
              <p className="font-semibold text-white">{formatDate(org.created_at)}</p>
            </div>
            {org.stripe_customer_id && (
              <div>
                <p className="text-slate-400">Stripe Customer</p>
                <p className="font-mono text-xs text-slate-300">{org.stripe_customer_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription and Revenue */}
      {subscription && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Subscription</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Status</p>
              <p className="mt-2 font-semibold text-white capitalize">{subscription.status}</p>
            </div>
            <div className="rounded bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Sites</p>
              <p className="mt-2 font-semibold text-white">{subscription.quantity}</p>
            </div>
            <div className="rounded bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Monthly Revenue</p>
              <p className="mt-2 font-semibold text-white text-green-400">${monthlyRevenue}</p>
            </div>
            <div className="rounded bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Period End</p>
              <p className="mt-2 font-semibold text-white text-sm">
                {subscription.current_period_end ? formatDate(subscription.current_period_end) : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Users ({users.length})</h2>
        {users.length > 0 ? (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded bg-slate-800 p-3">
                <div>
                  <p className="font-medium text-white">{user.full_name || user.email}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <span className="text-xs font-semibold text-slate-300 bg-slate-700 px-2 py-1 rounded">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No users in this organization</p>
        )}
      </div>

      {/* Sites */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Sites ({sites.length})</h2>
        {sites.length > 0 ? (
          <div className="space-y-3">
            {siteStats.map(({ site, articleCount, subscriberCount, statusCounts }) => (
              <div
                key={site.id}
                className="rounded border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{site.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{site.slug}</p>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Template</p>
                        <p className="text-white font-medium capitalize">{site.template_id}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Status</p>
                        <p className="text-white font-medium capitalize">{site.status}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Articles</p>
                        <p className="text-white font-medium">{articleCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Subscribers</p>
                        <p className="text-white font-medium">{subscriberCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No sites in this organization</p>
        )}
      </div>
    </div>
  );
}
