'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      company: 'Digital Insights Pro',
      role: 'Founder',
      quote:
        'Production House helped me launch 12 content sites in just 3 weeks. The AI rewriting is incredible and my SEO rankings have doubled.',
      rating: 5,
      avatar: 'SC',
    },
    {
      name: 'Marcus Williams',
      company: 'Tech Authority Media',
      role: 'Content Director',
      quote:
        'The automation saved us 20+ hours per week. What used to take a team of 4 now runs on Production House. Amazing ROI.',
      rating: 5,
      avatar: 'MW',
    },
    {
      name: 'Elena Rodriguez',
      company: 'Health & Wellness Syndicate',
      role: 'CEO',
      quote:
        'The newsletter integration is seamless and our subscriber growth has tripled. This platform is a game-changer for content agencies.',
      rating: 5,
      avatar: 'ER',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-900 text-blue-400 hover:bg-slate-800">Testimonials</Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Loved by Content Creators</h2>
          <p className="text-lg text-slate-400">Join hundreds of agencies and creators building their empire</p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="bg-slate-800/50 border-slate-700 p-8 flex flex-col hover:border-blue-600 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-300 mb-6 flex-grow">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-700">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
