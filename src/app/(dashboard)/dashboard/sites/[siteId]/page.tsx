'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ArticleTable } from '@/components/dashboard/ArticleTable';
import { Loader2, Play, Pause } from 'lucide-react';
import { Site, Article } from '@/types/database';

interface SiteStats {
  source_count: number;
  article_counts: {
    raw: number;
    published: number;
    unpublished: number;
    pending: number;
  };
  subscriber_count: number;
}

export default function SiteDetail() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<Site | null>(null);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch site
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (!siteRes.ok) throw new Error('Failed to fetch site');
        const siteData = await siteRes.json();
        setSite(siteData);

        // Fetch stats
        const statsRes = await fetch(`/api/sites/${siteId}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch recent articles
        const articlesRes = await fetch(`/api/articles?siteId=${siteId}&limit=5`);
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData.articles || []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const handleToggleStatus = async () => {
    if (!site) return;

    try {
      const newStatus = site.status === 'active' ? 'paused' : 'active';
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSite(updated);
      }
    } catch (err) {
      console.error('Error updating site:', err);
    }
  };

  const handleFetchNow = async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/fetch`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Fetch started. Check job logs for progress.');
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <Card className="bg-red-950 border-red-800 p-6 text-red-200">
        <p>Error: {error || 'Site not found'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{site.name}</h1>
            <p className="text-slate-400 mt-1">{site.description}</p>
          </div>
          <div className="flex gap-3">
            <Badge
              className={
                site.status === 'active'
                  ? 'bg-green-900 text-green-200'
                  : 'bg-yellow-900 text-yellow-200'
              }
            >
              {site.status}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            className="border-slate-700"
          >
            {site.status === 'active' ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Site
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume Site
              </>
            )}
          </Button>
          <Button
            onClick={handleFetchNow}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Fetch Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            label="Sources"
            value={stats.source_count}
            trend={0}
          />
          <StatsCard
            label="Raw Articles"
            value={stats.article_counts.raw}
            trend={0}
          />
          <StatsCard
            label="Published"
            value={stats.article_counts.published}
            trend={0}
          />
          <StatsCard
            label="Subscribers"
            value={stats.subscriber_count}
            trend={0}
          />
        </div>
      )}

      {/* Recent Articles */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Articles</h2>
        <ArticleTable articles={articles} siteId={siteId} />
      </div>
    </div>
  );
}
