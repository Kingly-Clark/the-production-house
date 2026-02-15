'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

const ROTATING_WORDS = [
  'SEO Authority',
  'Website Traffic',
  'Brand',
  'App Downloads',
  'Social Reach',
];

function TypingText() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = ROTATING_WORDS[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex]);

  return (
    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

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
    <div className="text-left sm:text-left text-center text-white pt-8 sm:pt-24 md:pt-28 px-4 max-w-3xl pointer-events-none mx-auto sm:mx-0">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700/50 mb-4 sm:mb-6 backdrop-blur-sm pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-slate-300">Now accepting early adopters</span>
      </div>

      {/* Main headline */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-6 leading-tight tracking-tight">
        Automated Content Sites That Build Your
        <br />
        <TypingText />
      </h1>

      {/* Subheading */}
      <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-8 opacity-90 max-w-xl leading-relaxed text-slate-300 mx-auto sm:mx-0">
        Add your content sources, let our AI rewrite and optimize them, then publish automatically to beautiful sites with
        built-in newsletters, social media posting, and custom domains.
      </p>

      {/* CTA Buttons */}
      <div className="flex pointer-events-auto flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
        <Link href="/signup">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition duration-300 border border-blue-500/30 backdrop-blur-sm gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="hidden sm:flex bg-slate-900/50 border border-slate-600 hover:border-slate-400 text-slate-200 hover:text-white font-medium py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition duration-300 items-center justify-center backdrop-blur-sm"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
          Watch Demo
        </Button>
      </div>

      {/* Trust indicators */}
      <div className="flex flex-row flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 sm:gap-8 text-xs sm:text-sm text-slate-400 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-700/50">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-green-400">✓</span> No credit card
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-green-400">✓</span> 30-day trial
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
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
