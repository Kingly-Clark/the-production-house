'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'sonner';

export default function NewClientPage() {
  const router = useRouter();
  const { addClient, setSelectedClient } = useClientStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a client name');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create client');
      }

      const client = await res.json();
      addClient(client);
      setSelectedClient(client.id);
      toast.success(`Client "${client.name}" created successfully`);
      router.push('/dashboard/clients');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create client';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Client</h1>
          <p className="text-slate-400 mt-1">
            Create a client to organize your sites
          </p>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
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
              <p className="text-white font-medium">
                {name || 'New Client'}
              </p>
              <p className="text-sm text-slate-400">Client preview</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Client Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wunderfan, My Podcast"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                autoFocus
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
                placeholder="Brief description of this client or business..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-24"
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
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
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
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Enter a URL to an image for the client logo
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-slate-700 text-slate-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Client'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
