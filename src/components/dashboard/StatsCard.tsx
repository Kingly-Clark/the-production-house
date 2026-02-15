'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number;
  trend?: number;
}

export function StatsCard({ label, value, trend }: StatsCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <div className="space-y-3">
        <p className="text-sm text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          {trend !== undefined && trend !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
