'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Building2,
  Globe,
  Save,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { Client } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';

interface SiteInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export default function ClientSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const { updateClient, removeClient, setSelectedClient } = useClientStore();

  const [client, setClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const [clientRes, sitesRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`),
          fetch(`/api/sites?clientId=${clientId}`),
        ]);

        if (!clientRes.ok) {
          if (clientRes.status === 404) {
            toast.error('Client not found');
            router.push('/dashboard/clients');
            return;
          }
          throw new Error('Failed to fetch client');
        }

        const clientData = await clientRes.json();
        setClient(clientData);
        setName(clientData.name || '');
        setDescription(clientData.description || '');
        setWebsiteUrl(clientData.website_url || '');
        setLogoUrl(clientData.logo_url || '');

        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          setSites(sitesData);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to load client');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [clientId, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Client name is required');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          website_url: websiteUrl.trim() || null,
          logo_url: logoUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update client');
      }

      const updatedClient = await res.json();
      setClient(updatedClient);
      updateClient(clientId, updatedClient);
      toast.success('Client updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update client';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete client');
      }

      removeClient(clientId);
      setSelectedClient(null);
      toast.success('Client deleted successfully');
      router.push('/dashboard/clients');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete client';
      toast.error(message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/clients')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{client.name}</h1>
          <p className="text-slate-400 mt-1">Client settings and sites</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Client Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={() => setLogoUrl('')}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center">
                    {name ? (
                      <span className="text-2xl font-bold text-white">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Building2 className="w-8 h-8 text-white" />
                    )}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{name || 'Client'}</p>
                  <p className="text-sm text-slate-400">Preview</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Client Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Wunderfan"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="bg-slate-800 border-slate-700 text-white min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-slate-300">
                  Website URL
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl" className="text-slate-300">
                  Logo URL
                </Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-red-950/30 border-red-900/50 p-6">
            <h2 className="text-lg font-semibold text-red-300 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-red-300/70 mb-4">
              Deleting this client will unassign all sites from it. This action
              cannot be undone.
            </p>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-700 text-red-400 hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Client
              </Button>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Sites ({sites.length})
            </h2>
            {sites.length === 0 ? (
              <div className="text-center py-6">
                <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  No sites in this client yet
                </p>
                <Link href="/dashboard/sites/new">
                  <Button
                    size="sm"
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Create Site
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="text-white hover:text-blue-400 font-medium truncate block"
                      >
                        {site.name}
                      </Link>
                      <Badge
                        className={
                          site.status === 'active'
                            ? 'bg-green-900 text-green-200 mt-1'
                            : 'bg-slate-700 text-slate-200 mt-1'
                        }
                      >
                        {site.status}
                      </Badge>
                    </div>
                    <Link
                      href={`/s/${site.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
