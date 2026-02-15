'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPicker } from '@/components/dashboard/ColorPicker';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { ToneSelector } from '@/components/dashboard/ToneSelector';
import { Loader2 } from 'lucide-react';
import { Site, type SiteSettings, TemplateId, ToneOfVoice } from '@/types/database';

const FONTS = [
  'Inter',
  'Serif',
  'Mono',
  'System',
  'Poppins',
  'Playfair Display',
];

interface FormData extends SiteSettings {
  name: string;
  description: string | null;
  header_text: string | null;
  template_id: TemplateId;
  tone_of_voice: ToneOfVoice;
  articles_per_day: number;
  cron_enabled: boolean;
}

export default function SiteSettings() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<Site | null>(null);
  const [settings, setSettings] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch site
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (!siteRes.ok) throw new Error('Failed to fetch site');
        const siteData = await siteRes.json();
        setSite(siteData);

        // Fetch settings
        const settingsRes = await fetch(`/api/settings/${siteId}`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings({
            ...settingsData,
            name: siteData.name,
            description: siteData.description,
            header_text: siteData.header_text,
            template_id: siteData.template_id,
            tone_of_voice: siteData.tone_of_voice,
            articles_per_day: siteData.articles_per_day,
            cron_enabled: siteData.cron_enabled,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleColorChange = (field: string, value: string) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, [field]: value } : null
    );
  };

  const handleFontChange = (field: string, value: string) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, [field]: value } : null
    );
  };

  const handleSliderChange = (value: number[]) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, articles_per_day: value[0] } : null
    );
  };

  const handleSwitchChange = (checked: boolean) => {
    if (!settings) return;
    setSettings((prev) =>
      prev ? { ...prev, cron_enabled: checked } : null
    );
  };

  const handleSave = async () => {
    if (!settings || !site) return;

    try {
      setSaving(true);

      // Update site
      const siteRes = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          description: settings.description,
          header_text: settings.header_text,
          template_id: settings.template_id,
          tone_of_voice: settings.tone_of_voice,
          articles_per_day: settings.articles_per_day,
          cron_enabled: settings.cron_enabled,
        }),
      });

      if (!siteRes.ok) throw new Error('Failed to update site');

      // Update settings
      const settingsRes = await fetch(`/api/settings/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          accent_color: settings.accent_color,
          text_color: settings.text_color,
          background_color: settings.background_color,
          font_heading: settings.font_heading,
          font_body: settings.font_body,
          meta_title: settings.meta_title,
          meta_description: settings.meta_description,
          og_image_url: settings.og_image_url,
          google_analytics_id: settings.google_analytics_id,
          custom_css: settings.custom_css,
        }),
      });

      if (settingsRes.ok) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
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
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Site Settings</h1>
        <p className="text-slate-400 mt-2">Customize your site appearance and behavior</p>
      </div>

      {/* Basic Information */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Basic Information</h2>

        <div>
          <Label htmlFor="name" className="text-slate-300">
            Site Name
          </Label>
          <Input
            id="name"
            name="name"
            value={settings.name}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-slate-300">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={settings.description || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="header_text" className="text-slate-300">
            Header Text
          </Label>
          <Input
            id="header_text"
            name="header_text"
            value={settings.header_text || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
          />
        </div>
      </Card>

      {/* Template & Tone */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Template & Voice</h2>

        <div>
          <Label className="text-slate-300 mb-3 block">Template</Label>
          <TemplateSelector
            value={settings.template_id}
            onChange={(value) =>
              setSettings((prev) =>
                prev
                  ? { ...prev, template_id: value as TemplateId }
                  : null
              )
            }
          />
        </div>

        <div>
          <Label className="text-slate-300 mb-3 block">Tone of Voice</Label>
          <ToneSelector
            value={settings.tone_of_voice}
            onChange={(value) =>
              setSettings((prev) =>
                prev
                  ? { ...prev, tone_of_voice: value as ToneOfVoice }
                  : null
              )
            }
          />
        </div>
      </Card>

      {/* Publishing Settings */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Publishing</h2>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">
              Articles Per Day: {settings.articles_per_day}
            </Label>
          </div>
          <Slider
            value={[settings.articles_per_day]}
            onValueChange={handleSliderChange}
            min={1}
            max={20}
            step={1}
            className="mt-4"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <Label className="text-slate-300">Enable Automation</Label>
          <Switch
            checked={settings.cron_enabled}
            onCheckedChange={handleSwitchChange}
          />
        </div>
      </Card>

      {/* Colors */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Colors</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorPicker
            label="Primary"
            value={settings.primary_color}
            onChange={(value) => handleColorChange('primary_color', value)}
          />
          <ColorPicker
            label="Secondary"
            value={settings.secondary_color}
            onChange={(value) => handleColorChange('secondary_color', value)}
          />
          <ColorPicker
            label="Accent"
            value={settings.accent_color}
            onChange={(value) => handleColorChange('accent_color', value)}
          />
          <ColorPicker
            label="Text"
            value={settings.text_color}
            onChange={(value) => handleColorChange('text_color', value)}
          />
          <ColorPicker
            label="Background"
            value={settings.background_color}
            onChange={(value) => handleColorChange('background_color', value)}
          />
        </div>
      </Card>

      {/* Fonts */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Typography</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="font_heading" className="text-slate-300">
              Heading Font
            </Label>
            <Select value={settings.font_heading} onValueChange={(value) => handleFontChange('font_heading', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font} className="text-white">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="font_body" className="text-slate-300">
              Body Font
            </Label>
            <Select value={settings.font_body} onValueChange={(value) => handleFontChange('font_body', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font} className="text-white">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* SEO */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">SEO & Analytics</h2>

        <div>
          <Label htmlFor="meta_title" className="text-slate-300">
            Meta Title
          </Label>
          <Input
            id="meta_title"
            name="meta_title"
            value={settings.meta_title || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="meta_description" className="text-slate-300">
            Meta Description
          </Label>
          <Textarea
            id="meta_description"
            name="meta_description"
            value={settings.meta_description || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="og_image_url" className="text-slate-300">
            OG Image URL
          </Label>
          <Input
            id="og_image_url"
            name="og_image_url"
            value={settings.og_image_url || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="google_analytics_id" className="text-slate-300">
            Google Analytics ID
          </Label>
          <Input
            id="google_analytics_id"
            name="google_analytics_id"
            value={settings.google_analytics_id || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2"
            placeholder="GA-XXXXXXXXX-X"
          />
        </div>
      </Card>

      {/* Custom CSS */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Custom CSS</h2>

        <div>
          <Label htmlFor="custom_css" className="text-slate-300">
            CSS
          </Label>
          <Textarea
            id="custom_css"
            name="custom_css"
            value={settings.custom_css || ''}
            onChange={handleInputChange}
            className="bg-slate-800 border-slate-700 text-white mt-2 font-mono text-sm"
            rows={10}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
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
    </div>
  );
}
