'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ArticleTable } from '@/components/dashboard/ArticleTable';
import { Loader2, Play, Pause, ExternalLink, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { Site, Article } from '@/types/database';
import { toast } from 'sonner';

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
  const router = useRouter();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<Site | null>(null);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [rewriting, setRewriting] = useState(false);

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
        toast.success(`Site ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      }
    } catch (err) {
      console.error('Error updating site:', err);
      toast.error('Failed to update site status');
    }
  };

  const handleFetchNow = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/fetch`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const s = data.stats;
        if (s.newArticles > 0) {
          toast.success(
            `Fetched ${s.newArticles} new article${s.newArticles !== 1 ? 's' : ''} from ${s.sourcesProcessed} source${s.sourcesProcessed !== 1 ? 's' : ''}${s.duplicates > 0 ? ` (${s.duplicates} duplicates skipped)` : ''}`
          );
        } else if (s.articlesFound > 0 && s.duplicates === s.articlesFound) {
          toast.info('No new articles found — all articles have already been fetched.');
        } else if (s.articlesFound === 0) {
          toast.info('No articles found in your sources. Check that your source URLs are correct.');
        } else {
          toast.info('Fetch completed.');
        }

        // Refresh stats and articles after fetching
        const statsRes = await fetch(`/api/sites/${siteId}/stats`);
        if (statsRes.ok) setStats(await statsRes.json());

        const articlesRes = await fetch(`/api/articles?siteId=${siteId}&limit=5`);
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData.articles || []);
        }
      } else {
        toast.error(data.error || 'Failed to fetch sources');
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
      toast.error('Failed to fetch sources');
    } finally {
      setFetching(false);
    }
  };

  const handleRewriteNow = async () => {
    setRewriting(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/rewrite`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const s = data.stats;
        if (s.published > 0) {
          toast.success(
            `Rewrote and published ${s.published} article${s.published !== 1 ? 's' : ''}` +
            (s.errors > 0 ? ` (${s.errors} errors)` : '')
          );
        } else if (s.processed === 0) {
          toast.info('No raw articles to rewrite. Fetch sources first.');
        } else {
          toast.info(`Processed ${s.processed} articles but none were published.`);
        }

        // Refresh stats and articles
        const statsRes = await fetch(`/api/sites/${siteId}/stats`);
        if (statsRes.ok) setStats(await statsRes.json());

        const articlesRes = await fetch(`/api/articles?siteId=${siteId}&limit=5`);
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData.articles || []);
        }
      } else {
        toast.error(data.error || 'Failed to rewrite articles');
      }
    } catch {
      toast.error('Failed to rewrite articles');
    } finally {
      setRewriting(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!site) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`"${site.name}" has been deleted`);
        router.push('/dashboard/sites');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete site');
      }
    } catch (err) {
      console.error('Error deleting site:', err);
      toast.error('Failed to delete site');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
      {/* Back link */}
      <Link
        href="/dashboard/sites"
        className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Sites
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{site.name}</h1>
            <p className="text-slate-400 mt-1">{site.description}</p>
          </div>
          <div className="flex items-center gap-3">
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

        <div className="flex flex-wrap gap-3">
          {/* View Site */}
          <Link
            href={`/s/${site.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Site
            </Button>
          </Link>

          {/* Toggle Status */}
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

          {/* Fetch Now */}
          <Button
            onClick={handleFetchNow}
            disabled={fetching}
            variant="outline"
            className="border-slate-700"
          >
            {fetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              'Fetch Now'
            )}
          </Button>

          {/* Rewrite Now */}
          <Button
            onClick={handleRewriteNow}
            disabled={rewriting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {rewriting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Rewrite Now
              </>
            )}
          </Button>

          {/* Delete Site */}
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300 ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Site
            </Button>
          ) : (
            <div className="flex items-center gap-2 ml-auto bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
              <p className="text-red-300 text-sm mr-2">Are you sure?</p>
              <Button
                onClick={handleDeleteSite}
                disabled={deleting}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Yes, delete'
                )}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                size="sm"
                variant="outline"
                className="border-red-800 text-red-300"
              >
                Cancel
              </Button>
            </div>
          )}
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
