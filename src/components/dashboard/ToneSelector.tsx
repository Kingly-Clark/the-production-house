'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToneOfVoice } from '@/types/database';

const TONES: Array<{ value: ToneOfVoice; label: string; description: string }> = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and confident' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'witty', label: 'Witty', description: 'Clever and humorous' },
  { value: 'formal', label: 'Formal', description: 'Academic and structured' },
  { value: 'conversational', label: 'Conversational', description: 'Natural and engaging' },
];

interface ToneSelectorProps {
  value: ToneOfVoice;
  onChange: (value: ToneOfVoice) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ToneOfVoice)}>
      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700">
        {TONES.map((tone) => (
          <SelectItem key={tone.value} value={tone.value} className="text-white">
            <div>
              <p>{tone.label}</p>
              <p className="text-xs text-slate-400">{tone.description}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
