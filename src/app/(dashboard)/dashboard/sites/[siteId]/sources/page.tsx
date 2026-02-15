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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Trash2, Check, X } from 'lucide-react';
import { Source, SourceType } from '@/types/database';

export default function SourcesPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    url: '',
    name: '',
    source_type: 'rss' as SourceType,
  });

  useEffect(() => {
    fetchSources();
  }, [siteId]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/sources?siteId=${siteId}`);
      if (!res.ok) throw new Error('Failed to fetch sources');

      const data = await res.json();
      setSources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (sourceId: string) => {
    try {
      setValidating(sourceId);
      const res = await fetch(`/api/sources/${sourceId}/validate`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchSources();
      } else {
        alert('Validation failed. Check the source URL.');
      }
    } catch (err) {
      alert('Error validating source');
    } finally {
      setValidating(null);
    }
  };

  const handleAddSource = async () => {
    try {
      setAdding(true);

      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          url: formData.url,
          name: formData.name || undefined,
          source_type: formData.source_type,
        }),
      });

      if (res.ok) {
        setFormData({ url: '', name: '', source_type: 'rss' });
        setDialogOpen(false);
        await fetchSources();
      } else {
        alert('Failed to add source');
      }
    } catch (err) {
      alert('Error adding source');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (source: Source) => {
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !source.is_active }),
      });

      if (res.ok) {
        await fetchSources();
      }
    } catch (err) {
      alert('Error updating source');
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;

    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchSources();
      } else {
        alert('Failed to delete source');
      }
    } catch (err) {
      alert('Error deleting source');
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
          <h1 className="text-3xl font-bold text-white">Sources</h1>
          <p className="text-slate-400 mt-2">
            Manage RSS feeds and sitemaps for your site
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={sources.length >= 5}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </Button>
      </div>

      {sources.length >= 5 && (
        <Card className="bg-yellow-950 border-yellow-800 p-4 text-yellow-200">
          <p>You have reached the maximum of 5 sources.</p>
        </Card>
      )}

      {error && (
        <Card className="bg-red-950 border-red-800 p-4 text-red-200">
          <p>Error: {error}</p>
        </Card>
      )}

      {sources.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <p className="text-slate-400 mb-6">No sources added yet.</p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Source
          </Button>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-800 border-b border-slate-700">
              <TableRow>
                <TableHead className="text-slate-300">Name</TableHead>
                <TableHead className="text-slate-300">URL</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Last Fetched</TableHead>
                <TableHead className="text-slate-300">Articles</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow
                  key={source.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <TableCell className="text-white font-medium">
                    {source.name || 'Unnamed'}
                  </TableCell>
                  <TableCell className="text-slate-300 truncate max-w-xs">
                    {source.url}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <Badge className="bg-blue-900 text-blue-200">
                      {source.source_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {source.is_validated ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-yellow-500" />
                      )}
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={() => handleToggleActive(source)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {source.last_fetched_at
                      ? new Date(source.last_fetched_at).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {source.article_count}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={validating === source.id}
                        onClick={() => handleValidate(source.id)}
                        className="text-xs"
                      >
                        {validating === source.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Validate'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(source.id)}
                        className="text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Source Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Source</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="url" className="text-slate-300">
                Source URL
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://example.com/feed.xml"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="name" className="text-slate-300">
                Name (Optional)
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Tech News Daily"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Type</Label>
              <Select
                value={formData.source_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    source_type: value as SourceType,
                  }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="rss" className="text-white">
                    RSS Feed
                  </SelectItem>
                  <SelectItem value="sitemap" className="text-white">
                    Sitemap
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddSource}
                disabled={!formData.url || adding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Source'
                )}
              </Button>
              <Button
                onClick={() => setDialogOpen(false)}
                variant="outline"
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
