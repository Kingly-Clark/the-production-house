// Production House — Billing Dashboard Page
// Displays subscription info, billing history, and management options
// =============================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BillingCard } from '@/components/dashboard/BillingCard';
import { AddSiteDialog } from '@/components/dashboard/AddSiteDialog';
import type { Organization, Subscription, Site } from '@/types/database';

const PRICE_PER_SITE = 49;

export default function BillingPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load organization and subscription data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Fetch organization and subscription from API (we'll create this)
        const res = await fetch('/api/billing/info');
        if (!res.ok) {
          throw new Error(`Failed to load billing info: ${res.statusText}`);
        }

        const data = await res.json();
        setOrganization(data.organization);
        setSubscription(data.subscription);
        setSites(data.sites);

        // Check for success/cancelled query params
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
          setSuccessMessage('Checkout completed successfully!');
          // Clear the query param
          window.history.replaceState({}, '', '/dashboard/billing');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load billing info';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current site count + 1 for new site
      const nextQuantity = sites.length + 1;

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: nextQuantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create portal session');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portal failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSite = async (siteName: string, slug: string) => {
    try {
      setIsAddingSite(true);
      setError(null);

      const res = await fetch('/api/billing/add-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create site');
      }

      // Reload data
      const infoRes = await fetch('/api/billing/info');
      if (infoRes.ok) {
        const data = await infoRes.json();
        setOrganization(data.organization);
        setSubscription(data.subscription);
        setSites(data.sites);
      }

      setSuccessMessage(`Site "${siteName}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add site';
      throw new Error(message);
    } finally {
      setIsAddingSite(false);
    }
  };

  const handleRemoveSite = async (siteId: string, siteName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${siteName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/billing/remove-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete site');
      }

      // Reload data
      const infoRes = await fetch('/api/billing/info');
      if (infoRes.ok) {
        const data = await infoRes.json();
        setOrganization(data.organization);
        setSubscription(data.subscription);
        setSites(data.sites);
      }

      setSuccessMessage(`Site deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete site';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !organization) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  if (!organization || !subscription) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            Unable to load billing information. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const activeSites = sites.filter((s) => s.status !== 'deleted');
  const activeSiteCount = activeSites.length;
  const siteCapacity = organization.max_sites;
  const capacityPercentage = Math.round((activeSiteCount / siteCapacity) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Plans</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your subscription and sites
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {successMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Current Plan Card */}
      <BillingCard subscription={subscription} quantity={activeSiteCount} />

      {/* Billing Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Button
          onClick={() => setAddSiteOpen(true)}
          disabled={isLoading || activeSiteCount >= siteCapacity}
          size="lg"
          className="w-full"
        >
          {activeSiteCount >= siteCapacity ? 'At Capacity' : 'Add New Site'}
        </Button>
        <Button
          onClick={handlePortal}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Manage Subscription
        </Button>
      </div>

      {/* Site Capacity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Site Capacity</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {activeSiteCount} of {siteCapacity} sites in use
        </p>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full transition-all ${
              capacityPercentage >= 100
                ? 'bg-red-500'
                : capacityPercentage >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
          />
        </div>

        {activeSiteCount >= siteCapacity && (
          <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-200">
            You've reached your site limit. Upgrade your plan to add more sites.
          </p>
        )}
      </div>

      {/* Sites List */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Sites</h3>
        </div>

        {activeSites.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No sites yet. Create your first site to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeSites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{site.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created {new Date(site.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    Manage
                  </Button>
                  <Button
                    onClick={() => handleRemoveSite(site.id, site.name)}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Site Dialog */}
      <AddSiteDialog
        open={addSiteOpen}
        onOpenChange={setAddSiteOpen}
        onSubmit={handleAddSite}
        isLoading={isAddingSite}
      />
    </div>
  );
}
