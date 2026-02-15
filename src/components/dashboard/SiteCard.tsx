'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Site } from '@/types/database';
import { Loader2, FileText, Users } from 'lucide-react';

interface SiteCardProps {
  site: Site;
}

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

export function SiteCard({ site }: SiteCardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/sites/${site.id}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [site.id]);

  const handleClick = () => {
    router.push(`/dashboard/sites/${site.id}`);
  };

  const templateColors: Record<string, string> = {
    classic: 'from-blue-600',
    magazine: 'from-purple-600',
    minimal: 'from-slate-600',
    bold: 'from-red-600',
    tech: 'from-cyan-600',
  };

  return (
    <Card
      onClick={handleClick}
      className="bg-slate-900 border-slate-800 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
    >
      {/* Template preview header */}
      <div
        className={`h-24 bg-gradient-to-r ${
          templateColors[site.template_id]
        } to-slate-900 relative`}
      />

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title and status */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white line-clamp-2">
            {site.name}
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              className={
                site.status === 'active'
                  ? 'bg-green-900 text-green-200'
                  : site.status === 'paused'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-slate-700 text-slate-200'
              }
            >
              {site.status}
            </Badge>
            <Badge className="bg-blue-900 text-blue-200">
              {site.template_id}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {site.description && (
          <p className="text-sm text-slate-400 line-clamp-2">
            {site.description}
          </p>
        )}

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Articles
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.article_counts.published}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Subscribers
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.subscriber_count}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
