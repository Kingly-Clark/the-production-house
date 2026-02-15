'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    header_text: '',
    template_id: 'classic',
    tone_of_voice: 'professional',
  });

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
              <Label htmlFor="template" className="text-white">Template</Label>
              <Select 
                value={formData.template_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
                disabled={loading}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="magazine">Magazine</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Choose a design template for your site
              </p>
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
