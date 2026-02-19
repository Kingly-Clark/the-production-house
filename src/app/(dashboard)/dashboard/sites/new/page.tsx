'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { TemplateId } from '@/types/database';
import { useClientStore } from '@/stores/clientStore';

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { clients, selectedClientId, fetchClients } = useClientStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    header_text: string;
    template_id: TemplateId;
    tone_of_voice: string;
    client_id: string | null;
  }>({
    name: '',
    slug: '',
    description: '',
    header_text: '',
    template_id: 'classic',
    tone_of_voice: 'professional',
    client_id: selectedClientId,
  });

  useEffect(() => {
    if (selectedClientId && !formData.client_id) {
      setFormData(prev => ({ ...prev, client_id: selectedClientId }));
    }
  }, [selectedClientId, formData.client_id]);

  // Auto-generate slug from site name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug only if slug is empty or was auto-generated
      slug: !prev.slug || prev.slug === prev.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.name.trim()) {
      setError('Site name is required');
      return;
    }
    
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create site');
      }

      // Redirect to the new site's dashboard
      router.push(`/dashboard/sites/${data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create site';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link 
        href="/dashboard/sites" 
        className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Sites
      </Link>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Create New Site</CardTitle>
          <CardDescription className="text-slate-400">
            Set up a new content syndication site. You can customize settings after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            {clients.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="client" className="text-white">Client</Label>
                <Select
                  value={formData.client_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value || null }))}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <SelectValue placeholder="Select a client" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          {client.logo_url ? (
                            <img
                              src={client.logo_url}
                              alt=""
                              className="w-4 h-4 rounded object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Assign this site to a client for organization
                </p>
              </div>
            )}

            {/* Site Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Site Name *</Label>
              <Input
                id="name"
                placeholder="My Tech Blog"
                value={formData.name}
                onChange={handleNameChange}
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">
                The display name for your site
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-white">Slug *</Label>
              <Input
                id="slug"
                placeholder="my-tech-blog"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">
                URL-friendly identifier. Your site will be accessible at: {formData.slug || 'your-slug'}.the-production-house.vercel.app
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                placeholder="A blog about technology, programming, and innovation..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={3}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">
                Brief description for SEO and site metadata
              </p>
            </div>

            {/* Header Text */}
            <div className="space-y-2">
              <Label htmlFor="header_text" className="text-white">Header Text</Label>
              <Input
                id="header_text"
                placeholder="Stay updated with the latest tech news"
                value={formData.header_text}
                onChange={(e) => setFormData(prev => ({ ...prev, header_text: e.target.value }))}
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">
                Tagline or subtitle shown in the site header
              </p>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label className="text-white">Template</Label>
              <p className="text-xs text-slate-500 mb-3">
                Choose a design template for your site. Click the eye icon to preview.
              </p>
              <TemplateSelector
                value={formData.template_id}
                onChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
              />
            </div>

            {/* Tone of Voice */}
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-white">Tone of Voice</Label>
              <Select 
                value={formData.tone_of_voice} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tone_of_voice: value }))}
                disabled={loading}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select tone of voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                The writing style for AI-generated content
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md border border-red-800 bg-red-950 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/sites')}
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Site'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
