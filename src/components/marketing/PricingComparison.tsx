'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

export function PricingComparison() {
  const plans = [
    {
      name: 'Starter',
      sites: 1,
      price: 49,
      description: 'Perfect for testing and small projects',
      highlighted: false,
    },
    {
      name: 'Growth',
      sites: 5,
      price: 245,
      description: 'Great for agencies and growing creators',
      highlighted: true,
    },
    {
      name: 'Scale',
      sites: 10,
      price: 490,
      description: 'For serious content networks',
      highlighted: false,
    },
  ];

  const features = [
    { name: 'AI Content Rewriting', included: true },
    { name: 'Beautiful Templates', included: true },
    { name: 'Custom Domain', included: true },
    { name: 'Newsletter System', included: true },
    { name: 'Social Media Auto-Posting', included: true },
    { name: 'Email Support', included: true },
    { name: 'API Access', included: 'Scale' },
    { name: 'Priority Support', included: 'Growth' },
    { name: 'Dedicated Account Manager', included: 'Scale' },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Popular Plans</h2>
          <p className="text-lg text-slate-400">Choose the plan that fits your needs</p>
        </div>

        {/* Plans cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-blue-600 ring-1 ring-blue-600 scale-105'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                  Most Popular
                </Badge>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-2">
                    ${plan.price}
                    <span className="text-lg text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-400">{plan.sites} sites</p>
                </div>

                <button
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all mb-6 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      : 'border border-slate-600 text-white hover:border-slate-500'
                  }`}
                >
                  Get Started
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Feature comparison table */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left">
                    <h3 className="text-white font-semibold">Features</h3>
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="px-6 py-4 text-center">
                      <p className="text-white font-semibold">{plan.name}</p>
                      <p className="text-sm text-slate-400">{plan.sites} sites</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={feature.name}
                    className={`border-b border-slate-700 ${idx % 2 === 0 ? 'bg-slate-900/30' : ''}`}
                  >
                    <td className="px-6 py-4 text-slate-300">{feature.name}</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="px-6 py-4 text-center">
                        {feature.included === true ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : feature.included === plan.name ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}
