'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);

  return (
    <div className="space-y-2">
      <Label className="text-slate-300 text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-slate-700 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="bg-slate-800 border-slate-700 text-white text-sm"
        />
      </div>
    </div>
  );
}
