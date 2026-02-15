'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail } from 'lucide-react';

export function FinalCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-8 sm:p-12 relative overflow-hidden">
          {/* Background gradient accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-blue-600/20 to-transparent rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Headline */}
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-center">
              Start Building Your Content Empire
            </h2>

            {/* Subheading */}
            <p className="text-lg text-slate-300 text-center mb-8">
              Join hundreds of creators and agencies automating their content syndication. 30-day free trial, no credit card required.
            </p>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pl-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2 whitespace-nowrap"
                >
                  Get Started
                  <ArrowRight size={20} />
                </Button>
              </div>
            </form>

            {/* Success message */}
            {submitted && (
              <div className="text-center text-green-400 text-sm mb-4 animate-pulse">
                Check your email for next steps!
              </div>
            )}

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400 pt-8 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>30-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
