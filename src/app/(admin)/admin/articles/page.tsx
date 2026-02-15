// Articles Overview — Table of recent articles across all sites

'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';

interface ArticleRow {
  id: string;
  title: string;
  site_name: string;
  status: string;
  published_at: string | null;
  view_count: number;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [filtered, setFiltered] = useState<ArticleRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/admin/articles?limit=100');
        const data = await res.json();
        setArticles(data);
        setFiltered(data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  useEffect(() => {
    let results = articles.filter((article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.site_name.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter) {
      results = results.filter((article) => article.status === statusFilter);
    }

    setFiltered(results);
  }, [search, statusFilter, articles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-900 text-green-300';
      case 'pending':
        return 'bg-yellow-900 text-yellow-300';
      case 'raw':
        return 'bg-blue-900 text-blue-300';
      case 'failed':
        return 'bg-red-900 text-red-300';
      case 'duplicate':
        return 'bg-purple-900 text-purple-300';
      case 'filtered':
        return 'bg-slate-700 text-slate-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} articles?`)) return;

    try {
      await fetch('/api/admin/articles/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      setArticles(articles.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete articles:', error);
    }
  };

  const statuses = ['published', 'pending', 'raw', 'failed', 'duplicate', 'filtered'];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Articles</h1>
        <p className="mt-2 text-slate-400">Recent articles across all sites</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white placeholder-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-700 bg-amber-900/20 p-4">
          <p className="text-sm text-amber-300">{selectedIds.size} selected</p>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 rounded bg-red-900 px-4 py-2 text-red-300 hover:bg-red-800 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No articles found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Published
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Views
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article) => (
                <tr
                  key={article.id}
                  className={`border-b border-slate-700 transition-colors ${
                    selectedIds.has(article.id) ? 'bg-slate-800' : 'hover:bg-slate-800'
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-white truncate max-w-xs">
                    {article.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{article.site_name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        article.status
                      )}`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{formatDate(article.published_at)}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{article.view_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="text-sm text-slate-400">
        Showing {filtered.length} of {articles.length} articles
      </div>
    </div>
  );
}
