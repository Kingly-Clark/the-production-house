'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Loader2,
  Building2,
  Globe,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'sonner';

interface ClientWithCount {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
  site_count: number;
}

export default function ClientsList() {
  const router = useRouter();
  const { clients, isLoading, fetchClients, removeClient } = useClientStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreateClient = () => {
    router.push('/dashboard/clients/new');
  };

  const handleManageClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`);
  };

  const handleDeleteClient = async (clientId: string) => {
    setDeletingId(clientId);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Client deleted successfully');
        removeClient(clientId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-2">
            Manage your clients and organize sites by business
          </p>
        </div>
        <Button
          onClick={handleCreateClient}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-6">
            No clients yet. Create your first client to organize your sites.
          </p>
          <Button
            onClick={handleCreateClient}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Client
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(clients as ClientWithCount[]).map((client) => (
            <Card
              key={client.id}
              className="bg-slate-900 border-slate-800 overflow-hidden hover:border-slate-700 transition-colors group relative"
            >
              {confirmDeleteId === client.id && (
                <div className="absolute inset-0 z-10 bg-slate-950/90 flex flex-col items-center justify-center gap-3 p-6 rounded-xl">
                  <p className="text-red-300 text-sm text-center font-medium">
                    Delete &quot;{client.name}&quot;?
                  </p>
                  <p className="text-slate-400 text-xs text-center">
                    Sites in this client will be unassigned.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Button
                      onClick={() => handleDeleteClient(client.id)}
                      disabled={deletingId === client.id}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deletingId === client.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                    <Button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === client.id}
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {confirmDeleteId !== client.id && (
                <button
                  onClick={() => setConfirmDeleteId(client.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/80 opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Delete client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate pr-8">
                      {client.name}
                    </h3>
                    {client.website_url && (
                      <a
                        href={client.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {new URL(client.website_url).hostname}
                      </a>
                    )}
                  </div>
                </div>

                {client.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {client.description}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-800 text-slate-300">
                    <Globe className="w-3 h-3 mr-1" />
                    {client.site_count || 0} {client.site_count === 1 ? 'site' : 'sites'}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <Button
                    onClick={() => handleManageClient(client.id)}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Manage Client
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Card
            className="bg-slate-900 border-slate-800 border-2 border-dashed hover:border-blue-500 cursor-pointer transition-colors p-6 flex items-center justify-center min-h-48"
            onClick={handleCreateClient}
          >
            <div className="text-center">
              <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">Add New Client</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
