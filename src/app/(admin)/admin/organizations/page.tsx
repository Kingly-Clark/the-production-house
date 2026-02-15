// Organizations Management — Table of all organizations

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';

interface OrgRow {
  id: string;
  name: string;
  website_url: string | null;
  plan_status: string;
  site_count: number;
  created_at: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgRow[]>([]);
  const [filtered, setFiltered] = useState<OrgRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch('/api/admin/organizations');
        const data = await res.json();
        setOrganizations(data);
        setFiltered(data);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgs();
  }, []);

  useEffect(() => {
    const results = organizations.filter((org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.plan_status.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results);
  }, [search, organizations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-300';
      case 'paused':
        return 'bg-yellow-900 text-yellow-300';
      case 'cancelled':
        return 'bg-red-900 text-red-300';
      case 'past_due':
        return 'bg-orange-900 text-orange-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Organizations</h1>
        <p className="mt-2 text-slate-400">Manage all client organizations</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
        <Search className="h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-white placeholder-slate-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No organizations found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Website
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Plan Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Sites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr key={org.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{org.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300 truncate max-w-xs">
                    {org.website_url || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        org.plan_status
                      )}`}
                    >
                      {org.plan_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{org.site_count}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{formatDate(org.created_at)}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="text-sm text-slate-400">
        Showing {filtered.length} of {organizations.length} organizations
      </div>
    </div>
  );
}
