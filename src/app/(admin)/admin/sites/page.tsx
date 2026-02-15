// Sites Overview — Table of all sites across all organizations

'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';

interface SiteRow {
  id: string;
  name: string;
  org_name: string;
  template_id: string;
  status: string;
  article_count: number;
  last_activity: string | null;
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [filtered, setFiltered] = useState<SiteRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch('/api/admin/sites');
        const data = await res.json();
        setSites(data);
        setFiltered(data);
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSites();
  }, []);

  useEffect(() => {
    let results = sites.filter((site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.org_name.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter) {
      results = results.filter((site) => site.status === statusFilter);
    }

    setFiltered(results);
  }, [search, statusFilter, sites]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-300';
      case 'paused':
        return 'bg-yellow-900 text-yellow-300';
      case 'building':
        return 'bg-blue-900 text-blue-300';
      case 'deleted':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getTemplateColor = (template: string) => {
    switch (template) {
      case 'classic':
        return 'bg-slate-700 text-slate-300';
      case 'magazine':
        return 'bg-purple-700 text-purple-300';
      case 'minimal':
        return 'bg-blue-700 text-blue-300';
      case 'bold':
        return 'bg-red-700 text-red-300';
      case 'tech':
        return 'bg-cyan-700 text-cyan-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const statuses = ['active', 'paused', 'building', 'deleted'];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Sites</h1>
        <p className="mt-2 text-slate-400">All sites across all organizations</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or organization..."
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No sites found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => (
                <tr key={site.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{site.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{site.org_name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded capitalize ${getTemplateColor(
                        site.template_id
                      )}`}
                    >
                      {site.template_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        site.status
                      )}`}
                    >
                      {site.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{site.article_count}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{formatDate(site.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="text-sm text-slate-400">
        Showing {filtered.length} of {sites.length} sites
      </div>
    </div>
  );
}
