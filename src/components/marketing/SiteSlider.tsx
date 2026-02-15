'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Check } from 'lucide-react';

export function SiteSlider() {
  const [siteCount, setSiteCount] = useState(1);
  const pricePerSite = 49;
  const totalPrice = siteCount * pricePerSite;

  const features = [
    'AI content rewriting',
    'Beautiful templates',
    'Newsletter system',
    'Social media posting',
    'Custom domain',
    'SEO optimization',
    '100+ RSS sources',
    'Email support',
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">Simple Pricing</Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Scale as You Grow</h2>
          <p className="text-lg text-slate-400">
            Pay only for what you use. No setup fees, no hidden costs.
          </p>
        </div>

        {/* Slider card */}
        <Card className="bg-slate-900 border-slate-800 p-8 mb-8">
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-slate-400 mb-2">Number of Sites</p>
                <p className="text-5xl font-bold text-white">{siteCount}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 mb-2">Total Monthly Cost</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ${totalPrice}
                </p>
              </div>
            </div>

            {/* Slider */}
            <Slider
              value={[siteCount]}
              onValueChange={(value) => setSiteCount(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-slate-400 mt-4">
              <span>1 Site</span>
              <span>20 Sites</span>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg mb-6">
            <div>
              <p className="text-slate-400 text-sm">Price per site</p>
              <p className="text-white font-semibold">${pricePerSite}/month</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Number of sites</p>
              <p className="text-white font-semibold">{siteCount}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Setup fee</p>
              <p className="text-white font-semibold">$0</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total</p>
              <p className="text-white font-semibold">${totalPrice}/month</p>
            </div>
          </div>

          {/* What's included */}
          <div>
            <p className="text-white font-semibold mb-4">What's included per site:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
            Get Started with {siteCount} Site{siteCount !== 1 ? 's' : ''}
          </button>
          <p className="text-slate-400 text-sm mt-4">30-day free trial. No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
