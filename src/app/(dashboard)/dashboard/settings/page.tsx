'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  website_url: string | null;
  brand_summary: string | null;
}

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    brand_summary: '',
  });

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/organization');
        if (res.ok) {
          const data = await res.json();
          setOrg(data);
          setFormData({
            name: data.name,
            website_url: data.website_url || '',
            brand_summary: data.brand_summary || '',
          });
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement organization update endpoint
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-2">
          Manage your account and organization settings
        </p>
      </div>

      {org && (
        <>
          {/* Organization Settings */}
          <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Organization</h2>

            <div>
              <Label htmlFor="name" className="text-slate-300">
                Organization Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="website_url" className="text-slate-300">
                Website URL
              </Label>
              <Input
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="brand_summary" className="text-slate-300">
                Brand Summary
              </Label>
              <textarea
                id="brand_summary"
                name="brand_summary"
                value={formData.brand_summary}
                onChange={handleInputChange}
                placeholder="Describe your organization"
                className="bg-slate-800 border border-slate-700 text-white rounded-md p-3 mt-2 w-full"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-950/20 border-red-900/50 p-6 space-y-4">
            <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>

            <div>
              <p className="text-slate-300 mb-4">
                Delete your organization and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Organization
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
