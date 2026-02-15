'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rss, Wand2, Send } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Add Your Sources',
      description: 'Connect RSS feeds or sitemaps from industry-leading publications and blogs relevant to your niche.',
      icon: Rss,
    },
    {
      number: 2,
      title: 'AI Rewrites Content',
      description: 'Our AI rewrites articles in your brand voice, adds SEO optimization, and creates unique variations.',
      icon: Wand2,
    },
    {
      number: 3,
      title: 'Publish Automatically',
      description: 'Articles publish on a schedule to your beautiful site, newsletter, and social media channels.',
      icon: Send,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">How It Works</Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Three Simple Steps</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Set it up once and let Production House handle the heavy lifting
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connecting lines */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[180%] h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-30" />
                )}

                {/* Card */}
                <Card className="bg-slate-900 border-slate-800 p-4 md:p-6 h-full relative z-10 hover:border-blue-600 transition-colors">
                  {/* Step number badge */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-3">
                    <span className="text-white font-bold text-sm">{step.number}</span>
                  </div>

                  {/* Icon + Title row */}
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300">{step.description}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
