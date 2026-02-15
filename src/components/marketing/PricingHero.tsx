'use client';

import { Badge } from '@/components/ui/badge';

export function PricingHero() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">Pricing</Badge>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-300 mb-4">
          Pay only for the sites you run. No setup fees, no hidden costs. Scale up or down anytime.
        </p>
        <p className="text-lg text-slate-400">
          Start with 1 site for $49/month or scale to 20+ sites. All plans include the same powerful features.
        </p>
      </div>
    </section>
  );
}
