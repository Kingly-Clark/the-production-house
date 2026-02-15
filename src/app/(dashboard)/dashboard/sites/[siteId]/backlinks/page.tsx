'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { BacklinkSettings, BacklinkPlacement } from '@/types/database';

export default function BacklinksPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [settings, setSettings] = useState<BacklinkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [siteId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/settings/${siteId}/backlinks`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        throw new Error('Failed to fetch backlink settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleToggle = (checked: boolean) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, is_enabled: checked } : null
    );
  };

  const handlePlacementChange = (value: string) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, placement_type: value as BacklinkPlacement } : null
    );
  };

  const handleFrequencyChange = (value: number[]) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, frequency: value[0] } : null
    );
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const res = await fetch(`/api/settings/${siteId}/backlinks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: settings.is_enabled,
          target_url: settings.target_url,
          placement_type: settings.placement_type,
          banner_image_url: settings.banner_image_url,
          banner_text: settings.banner_text,
          link_text: settings.link_text,
          frequency: settings.frequency,
        }),
      });

      if (res.ok) {
        alert('Backlink settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error: ${message}`);
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

  if (error || !settings) {
    return (
      <Card className="bg-red-950 border-red-800 p-6 text-red-200">
        <p>Error: {error || 'Failed to load settings'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Backlink Settings</h1>
        <p className="text-slate-400 mt-2">
          Configure backlinks to your site in published articles
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
        {/* Enable backlinks */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <Label className="text-slate-300">Enable Backlinks</Label>
          <Switch checked={settings.is_enabled} onCheckedChange={handleToggle} />
        </div>

        {settings.is_enabled && (
          <>
            {/* Target URL */}
            <div>
              <Label htmlFor="target_url" className="text-slate-300">
                Target URL
              </Label>
              <p className="text-slate-400 text-sm mt-1 mb-2">
                Where should backlinks point to?
              </p>
              <Input
                id="target_url"
                name="target_url"
                value={settings.target_url || ''}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Placement type */}
            <div>
              <Label className="text-slate-300 mb-2 block">
                Placement Type
              </Label>
              <Select
                value={settings.placement_type}
                onValueChange={handlePlacementChange}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="inline" className="text-white">
                    Inline (within article text)
                  </SelectItem>
                  <SelectItem value="banner" className="text-white">
                    Banner (after article)
                  </SelectItem>
                  <SelectItem value="both" className="text-white">
                    Both (inline + banner)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Link text */}
            <div>
              <Label htmlFor="link_text" className="text-slate-300">
                Link Text
              </Label>
              <Input
                id="link_text"
                name="link_text"
                value={settings.link_text || ''}
                onChange={handleInputChange}
                placeholder="e.g., Learn more"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>

            {/* Banner settings */}
            {(settings.placement_type === 'banner' ||
              settings.placement_type === 'both') && (
              <>
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Banner Settings
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="banner_image_url" className="text-slate-300">
                        Banner Image URL
                      </Label>
                      <Input
                        id="banner_image_url"
                        name="banner_image_url"
                        value={settings.banner_image_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://example.com/banner.png"
                        className="bg-slate-800 border-slate-700 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="banner_text" className="text-slate-300">
                        Banner Text
                      </Label>
                      <Textarea
                        id="banner_text"
                        name="banner_text"
                        value={settings.banner_text || ''}
                        onChange={handleInputChange}
                        placeholder="Banner content"
                        className="bg-slate-800 border-slate-700 text-white mt-2"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Frequency */}
            <div className="border-t border-slate-700 pt-4">
              <Label className="text-slate-300 mb-4 block">
                Frequency: Every {settings.frequency} articles
              </Label>
              <Slider
                value={[settings.frequency]}
                onValueChange={handleFrequencyChange}
                min={1}
                max={20}
                step={1}
              />
              <p className="text-slate-400 text-sm mt-2">
                Backlinks will appear in approximately 1 out of every{' '}
                {settings.frequency} published article
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Save Button */}
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
    </div>
  );
}
