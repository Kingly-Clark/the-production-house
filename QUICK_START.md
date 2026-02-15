# Quick Start Guide - Production House Marketing Site

## File Locations

All new files created for the marketing site and onboarding are in these locations:

### Pages (3 files)
```
src/app/(marketing)/
├── layout.tsx                    # Navigation, Footer wrapper
├── page.tsx                      # Home/Landing page
└── pricing/
    └── page.tsx                  # Pricing page
```

### Components (13 files)
```
src/components/marketing/
├── Navbar.tsx                    # Top navigation bar
├── Hero.tsx                      # Hero section with CTA
├── HowItWorks.tsx               # 3-step process section
├── Features.tsx                  # 6-feature grid
├── SiteSlider.tsx               # Landing page price slider
├── Testimonials.tsx             # 3 testimonial cards
├── FAQ.tsx                       # FAQ accordion
├── FinalCTA.tsx                 # Final call-to-action
├── Footer.tsx                    # Site footer
├── PricingHero.tsx              # Pricing page header
├── PricingSlider.tsx            # Pricing page calculator
├── PricingComparison.tsx        # Plan comparison table
└── PricingFAQ.tsx               # Pricing-specific FAQ
```

### APIs (2 files)
```
src/app/api/onboarding/
├── scrape/route.ts              # POST /api/onboarding/scrape
└── summarize/route.ts           # POST /api/onboarding/summarize
```

### Utilities (2 files)
```
src/lib/
├── scraper/
│   └── index.ts                 # Website scraping logic
└── ai/
    └── summarize.ts             # AI summarization with Gemini
```

## Running the Site

### Start Development Server
```bash
npm run dev
# Site runs at http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
```

## Testing the APIs

### Test Scraper API
```bash
curl -X POST http://localhost:3000/api/onboarding/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com"}'
```

### Test Summarizer API
```bash
curl -X POST http://localhost:3000/api/onboarding/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.example.com",
    "title": "Example Website",
    "description": "This is an example"
  }'
```

## Key Features

### Interactive Elements

**1. Pricing Slider**
- Drag to select 1-20 sites
- Price updates in real-time ($49/site)
- Found in: `SiteSlider.tsx` and `PricingSlider.tsx`

**2. FAQ Accordion**
- Click questions to expand/collapse
- Found in: `FAQ.tsx` and `PricingFAQ.tsx`

**3. Mobile Menu**
- Hamburger menu on mobile screens
- Found in: `Navbar.tsx`

**4. Email Signup**
- Email input with validation
- Success message feedback
- Found in: `FinalCTA.tsx`

## Design System

### Colors
- **Background:** `bg-slate-950` (darkest)
- **Cards:** `bg-slate-800/50`, `bg-slate-900`
- **Accent:** Blue to Purple gradient
- **Text:** `text-white`, `text-slate-300`

### Typography
- **Headlines:** Large, bold (`text-5xl` to `text-7xl`)
- **Body:** Regular weight, slate-300
- **Small:** slate-400

### Buttons
- **Primary:** Gradient blue-to-purple with hover effects
- **Secondary:** Outline style with hover

## Customization

### Change Pricing
Edit in `/components/marketing/SiteSlider.tsx` (landing) and `/components/marketing/PricingSlider.tsx` (pricing page):
```tsx
const pricePerSite = 49; // Change this value
```

### Update Testimonials
Edit in `/components/marketing/Testimonials.tsx`:
```tsx
const testimonials = [
  {
    name: 'Your Name',
    company: 'Your Company',
    role: 'Your Role',
    quote: 'Your quote here',
    rating: 5,
    avatar: 'YN',
  },
  // Add more
];
```

### Add FAQ Items
Edit in `/components/marketing/FAQ.tsx`:
```tsx
const faqs = [
  {
    question: 'Your question?',
    answer: 'Your answer here...',
  },
  // Add more
];
```

### Update Navigation Links
Edit in `/components/marketing/Navbar.tsx`:
```tsx
const navLinks = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  // Add more
];
```

## Environment Variables Required

For full functionality:
```bash
# Required for AI summarization
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

Optional (if using full database integration):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Page Routes

### Marketing Pages
- `GET /` - Landing page with all sections
- `GET /pricing` - Detailed pricing page

### API Endpoints
- `POST /api/onboarding/scrape` - Scrape website metadata
- `POST /api/onboarding/summarize` - Generate AI summary

### Auth Routes (existing)
- `GET /auth/signup` - Sign up page
- `GET /auth/login` - Login page

## Component Import Pattern

All components use the standard import pattern:
```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ArrowRight } from 'lucide-react';
```

UI components are from `@/components/ui/` (shadcn)
Icons are from `lucide-react`

## Common Tasks

### Add a New Section to Home Page
1. Create component in `/components/marketing/NewSection.tsx`
2. Use 'use client' if it has interactivity
3. Import in `/app/(marketing)/page.tsx`
4. Add to JSX in the main element

### Modify Section Colors
1. Update Tailwind classes (e.g., `bg-slate-900`)
2. Maintain consistency with gradient accents

### Add More Pricing Plans
1. Update `plans` array in `PricingComparison.tsx`
2. Update comparison table features array
3. Adjust grid cols if needed

### Update Copy Text
1. Edit text directly in component files
2. Keep typography classes consistent
3. Test responsiveness after changes

## Troubleshooting

### Slider Not Working
- Ensure `@/components/ui/slider` is imported
- Check that `onValueChange` handler is correct
- Verify min/max/step values

### Mobile Menu Not Showing
- Check navbar is using `'use client'`
- Verify `setIsOpen` state updates
- Test button click handler

### API Returns 400 Error
- Check request body format (must have `url` field)
- Verify URL is valid (starts with http/https)
- Check console for detailed error message

### API Returns 504 Timeout
- URL may be responding slowly
- Increase timeout value in `fetchWithTimeout()` if needed
- Try with different website

### Styles Not Applied
- Check Tailwind classes are correct
- Verify no typos in color names
- Clear `.next` folder and rebuild
- Check CSS file is loading (browser DevTools)

## Performance Tips

1. **Images:** Use next/image for optimization
2. **Fonts:** Already using Inter via Tailwind
3. **Icons:** lucide-react SVGs are lightweight
4. **Animations:** CSS transitions only (no libraries)
5. **State:** Components are client-side where needed

## Security Considerations

1. **Scraper API:**
   - 10-second fetch timeout protection
   - URL validation before fetching
   - Error handling for malicious responses

2. **Summarizer API:**
   - API key stored in server-side env var
   - No secrets exposed in client code

3. **Form Input:**
   - Email validation in FinalCTA
   - No sensitive data collection

## Next Steps

1. **Customize Colors:** Update gradient colors in components
2. **Add Your Testimonials:** Replace placeholder testimonials
3. **Update Copy:** Replace generic text with your messaging
4. **Set Up Analytics:** Add Google Analytics tracking
5. **Configure Auth:** Link signup buttons to auth system
6. **Set Up Email:** Connect email capture to service (Resend, etc.)
7. **Add Domain:** Deploy to production domain
8. **Enable HTTPS:** SSL certificate for custom domain

## Useful Links

- **Tailwind Docs:** https://tailwindcss.com
- **shadcn/ui:** https://ui.shadcn.com
- **lucide-react:** https://lucide.dev
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev

## Support

For issues or questions:
1. Check MARKETING_SITE_BUILD.md for detailed info
2. Check COMPONENT_GUIDE.md for component details
3. Review existing code examples
4. Check console for error messages
5. Check network tab for API issues

---

**Last Updated:** 2026-02-14
**Version:** 1.0
**Status:** Production Ready
