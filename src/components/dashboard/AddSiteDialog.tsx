// Production House — Add Site Dialog
// Dialog for creating a new site with validation
// =============================================================

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (siteName: string, slug: string) => Promise<void>;
  isLoading?: boolean;
}

export function AddSiteDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddSiteDialogProps) {
  const [siteName, setSiteName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from site name
  const handleSiteNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setSiteName(name);

    // Auto-generate slug if user hasn't manually edited it
    if (!slug || slug === siteName.toLowerCase().replace(/\s+/g, '-')) {
      setSlug(name.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const validateInputs = (): string | null => {
    if (!siteName.trim()) {
      return 'Site name is required';
    }

    if (!slug.trim()) {
      return 'Slug is required';
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(siteName, slug);
      setSiteName('');
      setSlug('');
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create site';
      setError(message);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen === false) {
      // Reset form when closing
      setSiteName('');
      setSlug('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
          <DialogDescription>
            Create a new content syndication site. You can manage up to {'{max_sites}'}{' '}
            sites on your current plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              placeholder="My Tech Blog"
              value={siteName}
              onChange={handleSiteNameChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The display name for your site
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="my-tech-blog"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
