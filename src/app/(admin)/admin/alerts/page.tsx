// Alerts Dashboard — Real-time alert monitoring with auto-refresh

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AlertCard from '@/components/admin/AlertCard';
import type { AdminAlert } from '@/types/database';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAlerts() {
    try {
      const res = await fetch(
        `/api/admin/alerts?resolved=${resolvedFilter === 'resolved'}`
      );
      const data = await res.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    setResolving(alertId);
    try {
      await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds: [alertId] }),
      });
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setResolving(null);
    }
  };

  const handleResolveAll = async () => {
    if (filtered.length === 0) return;
    if (!confirm(`Resolve ${filtered.length} alerts?`)) return;

    try {
      await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds: filtered.map((a) => a.id) }),
      });
      setAlerts(alerts.filter((a) => !filtered.includes(a)));
    } catch (error) {
      console.error('Failed to resolve alerts:', error);
    }
  };

  let filtered = alerts;

  if (typeFilter) {
    filtered = filtered.filter((alert) => alert.type === typeFilter);
  }

  if (severityFilter) {
    filtered = filtered.filter((alert) => alert.severity === severityFilter);
  }

  const alertTypes = ['cron_failure', 'source_error', 'rewrite_failure', 'payment_failed', 'domain_issue', 'social_error', 'system'];
  const severities = ['info', 'warning', 'critical'];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Alerts</h1>
        <p className="mt-2 text-slate-400">Real-time system alerts and issues</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <select
          value={resolvedFilter}
          onChange={(e) => setResolvedFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
        >
          <option value="unresolved">Unresolved Only</option>
          <option value="resolved">Resolved Only</option>
          <option value="all">All Alerts</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
        >
          <option value="">All Types</option>
          {alertTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
        >
          <option value="">All Severities</option>
          {severities.map((sev) => (
            <option key={sev} value={sev}>
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {filtered.length > 0 && resolvedFilter !== 'resolved' && (
        <div className="flex items-center justify-between rounded-lg border border-amber-700 bg-amber-900/20 p-4">
          <p className="text-sm text-amber-300">{filtered.length} unresolved alerts</p>
          <button
            onClick={handleResolveAll}
            className="flex items-center gap-2 rounded bg-amber-900 px-4 py-2 text-amber-300 hover:bg-amber-800 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resolve All
          </button>
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {resolvedFilter === 'unresolved' ? 'No unresolved alerts' : 'No alerts found'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div key={alert.id} className="flex items-stretch gap-4 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
              <AlertCard alert={alert} />
              <div className="flex items-center px-6">
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  disabled={resolving === alert.id}
                  className="rounded bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {resolving === alert.id ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-500">
        Last refresh: {new Date().toLocaleTimeString()} • Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
