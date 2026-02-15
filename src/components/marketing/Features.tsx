'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Layout,
  Mail,
  Share2,
  Globe,
  TrendingUp,
} from 'lucide-react';

export function Features() {
  const features = [
    {
      title: 'AI Content Rewriting',
      description: 'Transform any content into unique, SEO-optimized articles in your brand voice.',
      icon: Sparkles,
    },
    {
      title: '5 Beautiful Templates',
      description: 'Choose from professionally designed templates or customize every detail to match your brand.',
      icon: Layout,
    },
    {
      title: 'Newsletter System',
      description: 'Built-in email newsletter with subscriber management and beautiful templates.',
      icon: Mail,
    },
    {
      title: 'Social Media Auto-Posting',
      description: 'Automatically share articles to Twitter, LinkedIn, Facebook, Instagram, and TikTok.',
      icon: Share2,
    },
    {
      title: 'Custom Domains',
      description: 'Use your own custom domain with free SSL and automatic DNS configuration.',
      icon: Globe,
    },
    {
      title: 'SEO Optimization',
      description: 'Built-in meta tags, sitemaps, structured data, and Google Analytics integration.',
      icon: TrendingUp,
    },
  ];

  return (
    <section id="features" className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">Features</Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Everything You Need</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Powerful features built for content creators and agencies
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="bg-slate-800/50 border-slate-700 p-8 hover:border-blue-600 transition-all hover:shadow-lg hover:shadow-blue-600/10 group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
