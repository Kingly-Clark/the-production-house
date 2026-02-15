'use client';

import { Hero } from '@/components/marketing/Hero';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Features } from '@/components/marketing/Features';
import { SiteSlider } from '@/components/marketing/SiteSlider';
import { Testimonials } from '@/components/marketing/Testimonials';
import { FAQ } from '@/components/marketing/FAQ';
import { FinalCTA } from '@/components/marketing/FinalCTA';

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Hero />
      <HowItWorks />
      <Features />
      <SiteSlider />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
