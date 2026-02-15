'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Can I change my plan anytime?',
      answer:
        'Yes! You can upgrade or downgrade your plan at any time. If you upgrade, you\'ll only pay the difference for the remainder of your billing cycle. If you downgrade, the change takes effect at the next billing period.',
    },
    {
      question: 'Is there a setup fee?',
      answer:
        'No setup fees ever. You only pay the monthly cost for the number of sites you\'re running. If you pause sites during the month, you get a prorated credit.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers for annual plans. We process payments securely through Stripe.',
    },
    {
      question: 'Do you offer annual pricing?',
      answer:
        'Yes! Annual plans are available at a 20% discount. For example, 1 site would be $470/year instead of $588/year. Contact our sales team for more details on bulk annual discounts.',
    },
    {
      question: 'Can I try before I buy?',
      answer:
        'Absolutely! Every plan comes with a 30-day free trial. No credit card required to start. You get full access to all features during the trial period.',
    },
    {
      question: 'What if I need more than 20 sites?',
      answer:
        'Great question! We offer custom enterprise pricing for users who need 20+ sites. Contact our sales team at sales@productionhouse.com and we\'ll work with you on a custom solution.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">Pricing FAQ</Badge>
          <h2 className="text-4xl font-bold text-white mb-4">Pricing Questions?</h2>
          <p className="text-lg text-slate-400">We have answers</p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-blue-600 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white text-left">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
                  <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-white mb-4">Still have questions about pricing?</p>
          <a
            href="mailto:hello@productionhouse.com"
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            Contact Our Team
          </a>
        </div>
      </div>
    </section>
  );
}
