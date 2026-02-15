'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SiteCard } from '@/components/dashboard/SiteCard';
import { Plus, Loader2 } from 'lucide-react';
import { Site } from '@/types/database';

export default function SitesList() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/sites');
        const data = await res.json();

        // Check if the response contains an error
        if (!res.ok) {
          // If unauthorized, don't show error - user may need to log in
          if (res.status === 401) {
            setSites([]);
            return;
          }
          throw new Error(data?.error || 'Failed to fetch sites');
        }

        // Ensure data is an array (handle edge cases)
        setSites(Array.isArray(data) ? data : []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching sites:', message);
        // Don't show error for empty results, just show empty state
        setError(null);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const handleCreateSite = () => {
    router.push('/dashboard/sites/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-950 border-red-800 p-6 text-red-200">
        <p>Error: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sites</h1>
          <p className="text-slate-400 mt-2">
            Manage all your content syndication sites
          </p>
        </div>
        <Button
          onClick={handleCreateSite}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Site
        </Button>
      </div>

      {sites.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <p className="text-slate-400 mb-6">
            No sites currently active. Create one to get started!
          </p>
          <Button
            onClick={handleCreateSite}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Site
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onDeleted={(deletedId) =>
                setSites((prev) => prev.filter((s) => s.id !== deletedId))
              }
            />
          ))}
          {/* Create new site card */}
          <Card
            className="bg-slate-900 border-slate-800 border-2 border-dashed hover:border-blue-500 cursor-pointer transition-colors p-6 flex items-center justify-center min-h-48"
            onClick={handleCreateSite}
          >
            <div className="text-center">
              <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">Create New Site</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
