'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SiteCard } from '@/components/dashboard/SiteCard';
import { Plus, Loader2 } from 'lucide-react';
import { Site } from '@/types/database';

export default function DashboardOverview() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalSubscribers: 0,
    totalSites: 0,
  });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch current user
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(userData.full_name || userData.email);
        }

        // Fetch sites
        const sitesRes = await fetch('/api/sites');
        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          setSites(sitesData);

          // Calculate stats
          let totalArticles = 0;
          let totalSubscribers = 0;

          for (const site of sitesData) {
            const statsRes = await fetch(`/api/sites/${site.id}/stats`);
            if (statsRes.ok) {
              const siteStats = await statsRes.json();
              totalArticles += siteStats.published_count || 0;
              totalSubscribers += siteStats.subscriber_count || 0;
            }
          }

          setStats({
            totalArticles,
            totalSubscribers,
            totalSites: sitesData.length,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {userName || 'User'}
        </h1>
        <p className="text-slate-400 mt-2">
          Manage your content syndication sites and track performance
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          label="Total Sites"
          value={stats.totalSites}
          trend={0}
        />
        <StatsCard
          label="Total Articles Published"
          value={stats.totalArticles}
          trend={0}
        />
        <StatsCard
          label="Total Subscribers"
          value={stats.totalSubscribers}
          trend={0}
        />
      </div>

      {/* Sites section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Sites</h2>
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
              You don't have any sites yet. Create one to get started!
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
    </div>
  );
}
