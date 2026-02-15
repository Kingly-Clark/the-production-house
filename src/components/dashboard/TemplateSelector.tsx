'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { TemplateId } from '@/types/database';
import { Eye } from 'lucide-react';

const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  description: string;
  color: string;
  features: string[];
}> = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and elegant design',
    color: 'bg-gradient-to-br from-blue-600 to-slate-900',
    features: ['2-column layout with sidebar', 'Newsletter signup section', 'Trending topics widget', 'Latest stories feed'],
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Modern publication layout',
    color: 'bg-gradient-to-br from-purple-600 to-slate-900',
    features: ['Full-width hero image', 'Featured article highlight', '3-column article grid', 'Category filtering'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and focused',
    color: 'bg-gradient-to-br from-slate-600 to-slate-900',
    features: ['Single column layout', 'Centered content', 'Read time estimates', 'Focused reading experience'],
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Eye-catching design',
    color: 'bg-gradient-to-br from-red-600 to-slate-900',
    features: ['Large hero typography', 'Featured articles with images', 'Overlay card designs', 'High-impact visuals'],
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern tech aesthetic',
    color: 'bg-gradient-to-br from-cyan-600 to-slate-900',
    features: ['Monospace typography', 'Tag-based filtering', 'Card grid layout', 'Developer-friendly design'],
  },
];

// Template Preview Mockups
function ClassicPreview() {
  return (
    <div className="bg-slate-950 rounded-lg p-4 h-[300px] overflow-hidden">
      {/* Category tabs */}
      <div className="flex gap-2 mb-4">
        <div className="h-2 w-12 bg-blue-500 rounded" />
        <div className="h-2 w-10 bg-slate-700 rounded" />
        <div className="h-2 w-14 bg-slate-700 rounded" />
      </div>
      
      <div className="flex gap-4">
        {/* Main content */}
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 bg-slate-900 rounded-lg p-2">
              <div className="w-20 h-16 bg-slate-800 rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full bg-slate-700 rounded" />
                <div className="h-2 w-3/4 bg-slate-800 rounded" />
                <div className="h-2 w-1/2 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Sidebar */}
        <div className="w-1/3 space-y-3">
          <div className="bg-gradient-to-br from-blue-600 to-slate-800 rounded-lg p-3">
            <div className="h-2 w-16 bg-white/40 rounded mb-2" />
            <div className="h-2 w-full bg-white/20 rounded mb-2" />
            <div className="h-6 w-full bg-white/30 rounded" />
          </div>
          <div className="bg-slate-900 rounded-lg p-3 space-y-2">
            <div className="h-2 w-20 bg-slate-700 rounded" />
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-12 bg-slate-800 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MagazinePreview() {
  return (
    <div className="bg-slate-950 rounded-lg overflow-hidden h-[300px]">
      {/* Hero */}
      <div className="relative h-32 bg-gradient-to-br from-purple-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex flex-col justify-end">
          <div className="h-4 w-3/4 bg-white rounded mb-2" />
          <div className="h-2 w-1/2 bg-white/60 rounded" />
        </div>
      </div>
      
      {/* Category filter */}
      <div className="px-4 py-3 flex gap-2">
        <div className="h-2 w-8 bg-purple-500 rounded" />
        <div className="h-2 w-10 bg-slate-700 rounded" />
        <div className="h-2 w-12 bg-slate-700 rounded" />
      </div>
      
      {/* Grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="h-16 bg-slate-800" />
            <div className="p-2 space-y-1">
              <div className="h-2 w-full bg-slate-700 rounded" />
              <div className="h-2 w-2/3 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="bg-slate-950 rounded-lg p-4 h-[300px] overflow-hidden flex justify-center">
      <div className="w-2/3 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-800">
          <div className="h-6 w-32 bg-slate-700 rounded mx-auto" />
          <div className="h-2 w-48 bg-slate-800 rounded mx-auto" />
        </div>
        
        {/* Articles */}
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2 pb-4 border-b border-slate-800">
            <div className="h-4 w-full bg-slate-700 rounded" />
            <div className="flex gap-2">
              <div className="h-2 w-16 bg-slate-800 rounded" />
              <div className="h-2 w-1 bg-slate-700 rounded" />
              <div className="h-2 w-12 bg-slate-800 rounded" />
            </div>
            <div className="h-2 w-full bg-slate-800 rounded" />
            <div className="h-2 w-3/4 bg-slate-800 rounded" />
            <div className="h-2 w-16 bg-slate-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BoldPreview() {
  return (
    <div className="bg-slate-950 rounded-lg overflow-hidden h-[300px]">
      {/* Hero */}
      <div className="px-4 py-4">
        <div className="h-8 w-48 bg-slate-700 rounded mb-2" />
        <div className="h-2 w-64 bg-slate-800 rounded" />
      </div>
      
      {/* Featured Grid */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative h-28 bg-gradient-to-t from-red-900 to-slate-800 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 space-y-1">
              <div className="h-3 w-8 bg-red-500 rounded" />
              <div className="h-3 w-full bg-white rounded" />
              <div className="h-2 w-2/3 bg-white/60 rounded" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Category filter */}
      <div className="px-4 flex gap-2">
        <div className="h-2 w-8 bg-red-500 rounded" />
        <div className="h-2 w-12 bg-slate-700 rounded" />
        <div className="h-2 w-10 bg-slate-700 rounded" />
      </div>
    </div>
  );
}

function TechPreview() {
  return (
    <div className="bg-slate-950 rounded-lg p-4 h-[300px] overflow-hidden">
      {/* Header */}
      <div className="mb-4 space-y-2">
        <div className="h-6 w-32 bg-slate-700 rounded font-mono" />
        <div className="h-2 w-48 bg-slate-800 rounded" />
      </div>
      
      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="h-2 w-8 bg-slate-700 rounded" />
        <div className="h-5 w-10 bg-cyan-500 rounded" />
        <div className="h-5 w-12 bg-slate-800 rounded" />
        <div className="h-5 w-14 bg-slate-800 rounded" />
      </div>
      
      {/* Card Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-slate-800 rounded-lg overflow-hidden hover:border-cyan-500 transition-colors">
            <div className="h-14 bg-slate-900" />
            <div className="p-2 space-y-1">
              <div className="h-2 w-8 bg-cyan-500/30 rounded" />
              <div className="h-2 w-full bg-slate-700 rounded" />
              <div className="h-2 w-2/3 bg-slate-800 rounded" />
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <div className="h-2 w-8 bg-slate-800 rounded" />
                <div className="h-2 w-6 bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEW_COMPONENTS: Record<TemplateId, React.FC> = {
  classic: ClassicPreview,
  magazine: MagazinePreview,
  minimal: MinimalPreview,
  bold: BoldPreview,
  tech: TechPreview,
};

interface TemplateSelectorProps {
  value: TemplateId;
  onChange: (value: TemplateId) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<TemplateId | null>(null);
  
  const selectedTemplate = previewTemplate 
    ? TEMPLATES.find(t => t.id === previewTemplate) 
    : null;
  
  const PreviewComponent = previewTemplate 
    ? PREVIEW_COMPONENTS[previewTemplate] 
    : null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`overflow-hidden transition-all border-2 ${
              value === template.id
                ? 'border-blue-500 ring-2 ring-blue-500/50'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div 
              className={`h-32 ${template.color} cursor-pointer`}
              onClick={() => onChange(template.id)}
            />
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p 
                  className="text-sm font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={() => onChange(template.id)}
                >
                  {template.name}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template.id);
                  }}
                  title={`Preview ${template.name} template`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p 
                className="text-xs text-slate-400 line-clamp-2 cursor-pointer"
                onClick={() => onChange(template.id)}
              >
                {template.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${selectedTemplate?.color}`} />
              {selectedTemplate?.name} Template
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {/* Preview Mockup */}
          <div className="my-4">
            {PreviewComponent && <PreviewComponent />}
          </div>
          
          {/* Features List */}
          {selectedTemplate && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Key Features:</p>
              <ul className="grid grid-cols-2 gap-2">
                {selectedTemplate.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  onChange(previewTemplate);
                  setPreviewTemplate(null);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Select {selectedTemplate?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
