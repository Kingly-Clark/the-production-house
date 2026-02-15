'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check } from 'lucide-react';
import { SiteDomain } from '@/types/database';

export default function DomainPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [domain, setDomain] = useState<SiteDomain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ domain: '' });

  useEffect(() => {
    fetchDomain();
  }, [siteId]);

  const fetchDomain = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/domains?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setDomain(data[0] || null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    try {
      setAdding(true);

      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          domain: formData.domain,
          domain_type: 'custom',
        }),
      });

      if (res.ok) {
        setFormData({ domain: '' });
        setDialogOpen(false);
        await fetchDomain();
      } else {
        alert('Failed to add domain');
      }
    } catch (err) {
      alert('Error adding domain');
    } finally {
      setAdding(false);
    }
  };

  const handleCopyRecord = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Domain Settings</h1>
        <p className="text-slate-400 mt-2">
          Configure your custom domain
        </p>
      </div>

      {error && (
        <Card className="bg-red-950 border-red-800 p-4 text-red-200">
          <p>Error: {error}</p>
        </Card>
      )}

      {!domain ? (
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
          <p className="text-slate-300">
            No custom domain configured yet. Your site is currently available at:
          </p>
          <code className="block bg-slate-800 p-3 rounded text-blue-400 break-all">
            {siteId}.productionhouse.app
          </code>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Custom Domain
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Current Domain</h2>

            <div>
              <Label className="text-slate-300">Domain</Label>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 bg-slate-800 p-3 rounded text-blue-400">
                  {domain.domain}
                </code>
                <Badge
                  className={
                    domain.verification_status === 'verified'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-yellow-900 text-yellow-200'
                  }
                >
                  {domain.verification_status}
                </Badge>
              </div>
            </div>

            {domain.verification_status !== 'verified' && (
              <Alert className="bg-yellow-950 border-yellow-800">
                <AlertDescription className="text-yellow-200">
                  Your domain is not yet verified. Complete the DNS setup below to activate it.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {domain.verification_status !== 'verified' && (
            <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">DNS Configuration</h2>
              <p className="text-slate-300">
                Add the following CNAME record to your domain's DNS settings:
              </p>

              <div className="bg-slate-800 p-4 rounded space-y-3">
                <div>
                  <Label className="text-slate-400 text-sm">Type</Label>
                  <code className="block text-blue-400 font-mono">CNAME</code>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-slate-700 p-2 rounded text-blue-400">
                      @
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyRecord('@')}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Value</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-slate-700 p-2 rounded text-blue-400 break-all">
                      productionhouse.app
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopyRecord('productionhouse.app')
                      }
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-400 space-y-2">
                <p>
                  1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
                </p>
                <p>2. Find your DNS settings</p>
                <p>3. Add a new CNAME record with the values above</p>
                <p>
                  4. Wait 24-48 hours for DNS propagation
                </p>
              </div>
            </Card>
          )}

          {domain.ssl_status && (
            <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">SSL Status</h2>
              <p className="text-slate-300">{domain.ssl_status}</p>
            </Card>
          )}
        </div>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Custom Domain</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="domain" className="text-slate-300">
                Domain
              </Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    domain: e.target.value,
                  }))
                }
                placeholder="example.com"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddDomain}
                disabled={!formData.domain || adding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Domain'
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
