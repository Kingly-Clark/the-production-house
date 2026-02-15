// Stats Grid — Display platform statistics in card format

import { TrendingUp } from 'lucide-react';

interface Stats {
  totalOrganizations: number;
  totalSites: number;
  totalArticles: number;
  totalSubscribers: number;
  articlesToday: number;
  articlesWeek: number;
  articlesMonth: number;
  monthlyRevenue: number;
}

interface StatsGridProps {
  stats: Stats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    {
      label: 'Organizations',
      value: stats.totalOrganizations,
      color: 'bg-blue-900/20 border-blue-700',
      icon: '🏢',
    },
    {
      label: 'Sites',
      value: stats.totalSites,
      color: 'bg-purple-900/20 border-purple-700',
      icon: '🌐',
    },
    {
      label: 'Articles',
      value: stats.totalArticles,
      color: 'bg-green-900/20 border-green-700',
      icon: '📄',
    },
    {
      label: 'Subscribers',
      value: stats.totalSubscribers,
      color: 'bg-cyan-900/20 border-cyan-700',
      icon: '👥',
    },
    {
      label: 'Articles Today',
      value: stats.articlesToday,
      color: 'bg-yellow-900/20 border-yellow-700',
      icon: '📈',
    },
    {
      label: 'This Week',
      value: stats.articlesWeek,
      color: 'bg-orange-900/20 border-orange-700',
      icon: '📊',
    },
    {
      label: 'This Month',
      value: stats.articlesMonth,
      color: 'bg-red-900/20 border-red-700',
      icon: '📋',
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      color: 'bg-emerald-900/20 border-emerald-700',
      icon: '💰',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-lg border ${card.color} bg-slate-900 p-6 transition-transform hover:scale-105`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 font-medium">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
