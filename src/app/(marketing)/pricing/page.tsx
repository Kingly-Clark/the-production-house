'use client';

import { PricingHero } from '@/components/marketing/PricingHero';
import { PricingSlider } from '@/components/marketing/PricingSlider';
import { PricingComparison } from '@/components/marketing/PricingComparison';
import { PricingFAQ } from '@/components/marketing/PricingFAQ';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <PricingHero />
      <PricingSlider />
      <PricingComparison />
      <PricingFAQ />
    </main>
  );
}
