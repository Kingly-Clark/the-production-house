'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader2, Download } from 'lucide-react';
import { Subscriber } from '@/types/database';

export default function SubscribersPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    unconfirmed: 0,
  });

  useEffect(() => {
    fetchSubscribers();
  }, [siteId]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/subscribers?siteId=${siteId}`);
      if (!res.ok) throw new Error('Failed to fetch subscribers');

      const data = await res.json();
      setSubscribers(data);

      // Calculate stats
      const confirmed = data.filter((s: Subscriber) => s.is_confirmed).length;
      setStats({
        total: data.length,
        confirmed,
        unconfirmed: data.length - confirmed,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/subscribers/export?siteId=${siteId}`);
      if (!res.ok) throw new Error('Failed to export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${siteId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error exporting subscribers');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white">Subscribers</h1>
          <p className="text-slate-400 mt-2">
            Manage your newsletter subscribers
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={exporting || subscribers.length === 0}
          variant="outline"
          className="border-slate-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-950 border-red-800 p-4 text-red-200">
          <p>Error: {error}</p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          label="Total Subscribers"
          value={stats.total}
          trend={0}
        />
        <StatsCard
          label="Confirmed"
          value={stats.confirmed}
          trend={0}
        />
        <StatsCard
          label="Unconfirmed"
          value={stats.unconfirmed}
          trend={0}
        />
      </div>

      {subscribers.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <p className="text-slate-400">
            No subscribers yet
          </p>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-800 border-b border-slate-700">
              <TableRow>
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Subscribed</TableHead>
                <TableHead className="text-slate-300">Confirmed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow
                  key={subscriber.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <TableCell className="text-white font-medium">
                    {subscriber.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        subscriber.is_confirmed
                          ? 'bg-green-900 text-green-200'
                          : 'bg-yellow-900 text-yellow-200'
                      }
                    >
                      {subscriber.is_confirmed ? 'Confirmed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {new Date(subscriber.subscribed_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {subscriber.confirmed_at
                      ? new Date(subscriber.confirmed_at).toLocaleDateString()
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
