'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TemplateId } from '@/types/database';

const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  description: string;
  color: string;
}> = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and elegant design',
    color: 'bg-gradient-to-br from-blue-600 to-slate-900',
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Modern publication layout',
    color: 'bg-gradient-to-br from-purple-600 to-slate-900',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and focused',
    color: 'bg-gradient-to-br from-slate-600 to-slate-900',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Eye-catching design',
    color: 'bg-gradient-to-br from-red-600 to-slate-900',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern tech aesthetic',
    color: 'bg-gradient-to-br from-cyan-600 to-slate-900',
  },
];

interface TemplateSelectorProps {
  value: TemplateId;
  onChange: (value: TemplateId) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {TEMPLATES.map((template) => (
        <Card
          key={template.id}
          onClick={() => onChange(template.id)}
          className={`overflow-hidden cursor-pointer transition-all border-2 ${
            value === template.id
              ? 'border-blue-500 ring-2 ring-blue-500/50'
              : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className={`h-32 ${template.color}`} />
          <div className="p-3 space-y-2">
            <p className="text-sm font-semibold text-white">{template.name}</p>
            <p className="text-xs text-slate-400 line-clamp-2">
              {template.description}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
