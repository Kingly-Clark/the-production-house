'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArticleTable } from '@/components/dashboard/ArticleTable';
import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { Article, ArticleStatus } from '@/types/database';
import { toast } from 'sonner';

const STATUS_TABS: ArticleStatus[] = [
  'raw',
  'pending',
  'published',
  'unpublished',
  'failed',
  'duplicate',
];

export default function ArticlesPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewritingSelected, setRewritingSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const limit = 20;

  useEffect(() => {
    fetchArticles();
  }, [siteId, selectedStatus, page, searchQuery]);

  // Clear selection when changing tabs or pages
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedStatus, page]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        siteId,
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error('Failed to fetch articles');

      const data = await res.json();
      setArticles(data.articles || []);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
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
            `Fetched ${s.newArticles} new article${s.newArticles !== 1 ? 's' : ''}`
          );
        } else {
          toast.info('No new articles found.');
        }
        await fetchArticles();
      } else {
        toast.error(data.error || 'Failed to fetch sources');
      }
    } catch {
      toast.error('Error fetching sources');
    } finally {
      setFetching(false);
    }
  };

  const handleRewriteAll = async () => {
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
            (s.filtered > 0 ? ` (${s.filtered} filtered)` : '') +
            (s.duplicates > 0 ? ` (${s.duplicates} duplicates)` : '') +
            (s.errors > 0 ? ` (${s.errors} errors)` : '')
          );
        } else if (s.processed === 0) {
          toast.info('No raw articles to rewrite. Fetch sources first.');
        } else {
          toast.info(
            `Processed ${s.processed} articles: ${s.filtered} filtered, ${s.duplicates} duplicates, ${s.errors} errors`
          );
        }
        setSelectedIds(new Set());
        await fetchArticles();
      } else {
        toast.error(data.error || 'Failed to rewrite articles');
      }
    } catch {
      toast.error('Error rewriting articles');
    } finally {
      setRewriting(false);
    }
  };

  const handleRewriteSelected = async () => {
    if (selectedIds.size === 0) return;

    setRewritingSelected(true);
    try {
      const res = await fetch('/api/articles/rewrite-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: Array.from(selectedIds) }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const s = data.stats;
        if (s.published > 0) {
          toast.success(
            `Rewrote ${s.published} of ${s.processed} article${s.processed !== 1 ? 's' : ''}` +
            (s.failed > 0 ? ` (${s.failed} failed)` : '')
          );
        } else if (s.failed > 0) {
          toast.error(`All ${s.failed} articles failed to rewrite. Check your GOOGLE_AI_API_KEY.`);
        } else {
          toast.info(`Processed ${s.processed} articles: ${s.filtered} filtered, ${s.duplicates} duplicates`);
        }
        setSelectedIds(new Set());
        await fetchArticles();
      } else {
        toast.error(data.error || 'Failed to rewrite articles');
      }
    } catch {
      toast.error('Error rewriting articles');
    } finally {
      setRewritingSelected(false);
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const rawCount = articles.filter((a) => a.status === 'raw').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Articles</h1>
          <p className="text-slate-400 mt-2">
            Manage and publish articles
          </p>
        </div>
        <div className="flex gap-3">
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
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Fetch Now
              </>
            )}
          </Button>
          <Button
            onClick={handleRewriteAll}
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
                Rewrite All Raw
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-950/50 border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-blue-200 text-sm">
              {selectedIds.size} article{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleRewriteSelected}
                disabled={rewritingSelected}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {rewritingSelected ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rewriting {selectedIds.size}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Rewrite Selected ({selectedIds.size})
                  </>
                )}
              </Button>
              <Button
                onClick={() => setSelectedIds(new Set())}
                size="sm"
                variant="outline"
                className="border-blue-800 text-blue-300"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-950 border-red-800 p-4 text-red-200">
          <p>Error: {error}</p>
        </Card>
      )}

      {/* Search */}
      <Input
        placeholder="Search articles by title..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setPage(1);
        }}
        className="bg-slate-800 border-slate-700 text-white"
      />

      {/* Status Tabs */}
      <Tabs value={selectedStatus} onValueChange={(v) => {
        setSelectedStatus(v as ArticleStatus | 'all');
        setPage(1);
      }}>
        <TabsList className="bg-slate-800 border-b border-slate-700">
          <TabsTrigger value="all" className="text-slate-300">
            All
          </TabsTrigger>
          {STATUS_TABS.map((status) => (
            <TabsTrigger key={status} value={status} className="text-slate-300">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {['all', ...STATUS_TABS].map((status) => (
          <TabsContent key={status} value={status}>
            {articles.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 p-12 text-center">
                <p className="text-slate-400">
                  No articles in this category
                </p>
              </Card>
            ) : (
              <>
                <ArticleTable
                  articles={articles}
                  siteId={siteId}
                  selectable
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-slate-400 text-sm">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      variant="outline"
                      className="border-slate-700"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      variant="outline"
                      className="border-slate-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
