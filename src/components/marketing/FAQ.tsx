'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does the AI content rewriting work?',
      answer:
        'Our AI reads the original content and creates a completely new, unique version in your specified brand voice and tone. It preserves the core message while making it SEO-optimized and tailored to your audience. No plagiarism, no spinning—genuine rewriting using advanced language models.',
    },
    {
      question: 'Can I use my own custom domain?',
      answer:
        'Absolutely! You can connect any custom domain you own. We handle free SSL certificates, DNS configuration, and all the technical details. Your site will be completely branded as yours.',
    },
    {
      question: 'What RSS sources can I add?',
      answer:
        'You can add any RSS feed from any website that publishes one. Popular sources include industry blogs, news sites, competitor sites, and niche publications. We also support XML sitemaps for sites that don\'t have RSS feeds.',
    },
    {
      question: 'Is there a limit to how many articles I can publish?',
      answer:
        'No limits! You can set your site to publish 1-10 articles per day. As long as your RSS sources have content, your sites will keep publishing. Perfect for building authority.',
    },
    {
      question: 'What if I want to pause my sites?',
      answer:
        'You can pause or resume your sites anytime without losing any data. Articles already published stay live, and you won\'t be charged for paused sites during that month.',
    },
    {
      question: 'Do you offer customer support?',
      answer:
        'Yes! All customers get email support included. Premium plans include priority support and access to our Slack community. We also have comprehensive documentation and video tutorials.',
    },
  ];

  return (
    <section id="faq" className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">FAQ</Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Common Questions</h2>
          <p className="text-lg text-slate-400">Everything you need to know about Production House</p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="bg-slate-900 border-slate-800 overflow-hidden hover:border-blue-600 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white text-left">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950">
                  <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
