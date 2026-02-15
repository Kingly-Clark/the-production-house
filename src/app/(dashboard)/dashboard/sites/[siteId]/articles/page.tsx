'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArticleTable } from '@/components/dashboard/ArticleTable';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Article, ArticleStatus } from '@/types/database';

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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 20;

  useEffect(() => {
    fetchArticles();
  }, [siteId, selectedStatus, page, searchQuery]);

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
    try {
      setFetching(true);
      const res = await fetch(`/api/sites/${siteId}/fetch`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Fetch job started. Check back shortly.');
        setTimeout(fetchArticles, 2000);
      }
    } catch (err) {
      alert('Error starting fetch');
    } finally {
      setFetching(false);
    }
  };

  const handleRewriteNow = async () => {
    try {
      setRewriting(true);
      const res = await fetch(`/api/sites/${siteId}/rewrite`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Rewrite job started. Check back shortly.');
        setTimeout(fetchArticles, 2000);
      }
    } catch (err) {
      alert('Error starting rewrite');
    } finally {
      setRewriting(false);
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

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
            onClick={handleRewriteNow}
            disabled={rewriting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {rewriting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rewriting...
              </>
            ) : (
              'Rewrite Now'
            )}
          </Button>
        </div>
      </div>

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
                <ArticleTable articles={articles} siteId={siteId} />

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
