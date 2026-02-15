'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

function SplineBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-3xl opacity-20 animate-pulse" />
          </div>
        }
      >
        <Spline
          style={{
            width: '100%',
            height: '100vh',
            pointerEvents: 'auto',
          }}
          scene="https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode"
        />
      </Suspense>
      {/* Gradient overlays for better text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.4) 40%, rgba(2, 6, 23, 0.4) 60%, rgba(2, 6, 23, 0.9)),
            linear-gradient(to bottom, rgba(2, 6, 23, 0.3) 0%, transparent 30%, transparent 60%, rgba(2, 6, 23, 0.95) 100%)
          `,
        }}
      />
    </div>
  );
}

function HeroContent() {
  return (
    <div className="text-left text-white pt-24 sm:pt-32 md:pt-40 px-4 max-w-3xl pointer-events-none">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700/50 mb-8 backdrop-blur-sm pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-slate-300">Now accepting early adopters</span>
      </div>

      {/* Main headline */}
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
        Automated Content Sites That Build Your{' '}
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          SEO Authority
        </span>
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg md:text-xl mb-8 opacity-90 max-w-xl leading-relaxed text-slate-300">
        Add your content sources, let our AI rewrite and optimize them, then publish automatically to beautiful sites with
        built-in newsletters, social media posting, and custom domains.
      </p>

      {/* CTA Buttons */}
      <div className="flex pointer-events-auto flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
        <Link href="/signup">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-full transition duration-300 w-full sm:w-auto border border-blue-500/30 backdrop-blur-sm gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="bg-slate-900/50 border border-slate-600 hover:border-slate-400 text-slate-200 hover:text-white font-medium py-3 px-8 rounded-full transition duration-300 flex items-center justify-center w-full sm:w-auto backdrop-blur-sm"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
          Watch Demo
        </Button>
      </div>

      {/* Trust indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-sm text-slate-400 pt-8 mt-8 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-green-400">✓</span> No credit card required
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">✓</span> 30-day free trial
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">✓</span> Cancel anytime
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;
          const maxScroll = 500;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          if (heroContentRef.current) {
            heroContentRef.current.style.opacity = opacity.toString();
            heroContentRef.current.style.transform = `translateY(-${scrollPosition * 0.3}px)`;
          }
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Spline 3D Background */}
      <div className="absolute inset-0 z-0">
        <SplineBackground />
      </div>

      {/* Hero Content */}
      <div
        ref={heroContentRef}
        className="relative z-10 min-h-screen flex items-start"
        style={{ willChange: 'opacity, transform' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <HeroContent />
        </div>
      </div>
    </section>
  );
}
