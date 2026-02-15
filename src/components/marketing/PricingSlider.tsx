'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

export function PricingSlider() {
  const [siteCount, setSiteCount] = useState(3);
  const pricePerSite = 49;
  const totalPrice = siteCount * pricePerSite;

  const features = [
    'Unlimited RSS sources',
    'AI content rewriting',
    'Beautiful templates',
    'Newsletter system',
    'Social media posting',
    'Custom domain',
    'SSL certificate',
    'Google Analytics',
    'SEO optimization',
    'Email support',
    'Up to 10 posts/day per site',
    'Custom CSS',
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Slider */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700 p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-8">Configure Your Plan</h2>

              {/* Site count display */}
              <div className="mb-8">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-slate-300">Number of Sites</span>
                  <span className="text-4xl font-bold text-white">{siteCount}</span>
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

              {/* Pricing display */}
              <div className="space-y-3 mb-8 p-4 bg-slate-900 rounded-lg">
                <div className="flex justify-between text-slate-300">
                  <span>${pricePerSite} × {siteCount} site{siteCount !== 1 ? 's' : ''}</span>
                  <span className="font-semibold">${totalPrice}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total Monthly</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ${totalPrice}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Link href="/auth/signup" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6">
                  Start with {siteCount} Site{siteCount !== 1 ? 's' : ''}
                </Button>
              </Link>

              <p className="text-center text-sm text-slate-400 mt-4">30-day free trial</p>
            </Card>
          </div>

          {/* Right side - Features */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Everything You Get</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Bottom note */}
            <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">
                <strong>Need more sites?</strong> Contact us for enterprise pricing and custom solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
