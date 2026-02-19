'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Site } from '@/types/database';
import { Loader2, ExternalLink, Trash2, Settings, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface SiteWithClient extends Site {
  client_name?: string | null;
}

interface SiteCardProps {
  site: SiteWithClient;
  onDeleted?: (siteId: string) => void;
  showClientBadge?: boolean;
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

export function SiteCard({ site, onDeleted, showClientBadge = true }: SiteCardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleManage = () => {
    router.push(`/dashboard/sites/${site.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);

    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`"${site.name}" has been deleted`);
        onDeleted?.(site.id);
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

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden hover:border-slate-700 transition-colors group relative">

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-slate-950/90 flex flex-col items-center justify-center gap-3 p-6 rounded-xl">
          <p className="text-red-300 text-sm text-center font-medium">
            Delete &quot;{site.name}&quot;?
          </p>
          <p className="text-slate-400 text-xs text-center">
            This action cannot be undone.
          </p>
          <div className="flex gap-2 mt-1">
            <Button
              onClick={handleDelete}
              disabled={deleting}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              disabled={deleting}
              size="sm"
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Delete button in corner */}
      {!showDeleteConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/80 opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Delete site"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title and status */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white line-clamp-2 pr-8">
            {site.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
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
            {showClientBadge && site.client_name && (
              <Badge className="bg-purple-900 text-purple-200 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {site.client_name}
              </Badge>
            )}
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

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-slate-800">
          <Link
            href={`/s/${site.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-700 text-slate-300 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Site
            </Button>
          </Link>
          <Button
            onClick={handleManage}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Manage
          </Button>
        </div>
      </div>
    </Card>
  );
}
