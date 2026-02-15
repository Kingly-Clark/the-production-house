# Component Guide for Production House Marketing Site

## Component Hierarchy

### Page Structure

```
(marketing) layout
├── page (home)
│   ├── Hero
│   ├── HowItWorks
│   ├── Features
│   ├── SiteSlider
│   ├── Testimonials
│   ├── FAQ
│   └── FinalCTA
├── pricing/page
│   ├── PricingHero
│   ├── PricingSlider
│   ├── PricingComparison
│   └── PricingFAQ
├── Navbar (persistent)
└── Footer (persistent)
```

## Component Details

### Navigation Components

#### Navbar.tsx
**Purpose:** Sticky navigation bar with responsive menu

**Features:**
- Logo with gradient background
- Responsive nav links (How It Works, Features, Pricing, FAQ)
- Login and Get Started buttons
- Mobile hamburger menu with slide-down animation
- Sticky positioning with backdrop blur

**Props:** None
**State:** `isOpen` (boolean) - controls mobile menu visibility
**Interactive:** Yes - click handler for menu toggle

```tsx
<Navbar /> // Used in (marketing)/layout.tsx
```

#### Footer.tsx
**Purpose:** Site-wide footer with links and social media

**Features:**
- Logo and brand description
- Footer link sections (Product, Company, Legal)
- Social media icons (Twitter, GitHub, LinkedIn, Email)
- Copyright notice with current year
- Responsive grid layout

**Props:** None
**State:** None
**Interactive:** Minimal - links and external URLs

```tsx
<Footer /> // Used in (marketing)/layout.tsx
```

### Home Page Components

#### Hero.tsx
**Purpose:** Full-viewport hero section with headline and CTA

**Features:**
- Animated gradient background with multiple layers
- Large headline with gradient text for accent
- Subheading explaining value proposition
- Primary CTA button ("Get Started Free")
- Secondary button ("Watch Demo")
- Trust indicators (no credit card, free trial, cancel anytime)
- Green pulsing badge (early adopters)

**Props:** None
**State:** None
**Interactive:** Yes - buttons link to auth/signup

**Visual:**
```
┌─────────────────────────────────────┐
│     [Badge] Early adopters          │
│                                     │
│  Large Headline                     │
│  With Gradient Accent               │
│                                     │
│  Supporting subheading text         │
│                                     │
│  [Button] [Button]                  │
│                                     │
│  ✓ No credit card                  │
│  ✓ 30-day free trial               │
│  ✓ Cancel anytime                  │
└─────────────────────────────────────┘
```

#### HowItWorks.tsx
**Purpose:** 3-step visual flow showing how the platform works

**Features:**
- Badge header
- Section heading
- 3 cards in responsive grid (MD breakpoint)
- Connecting lines between cards (desktop only)
- Step numbers in gradient circles
- Icons from lucide-react
- Hover effects on cards
- Responsive column layout

**Props:** None
**State:** None
**Interactive:** Hover effects - border color change

**Steps:**
1. Add Your Sources (Rss icon)
2. AI Rewrites Content (Wand2 icon)
3. Publish Automatically (Send icon)

#### Features.tsx
**Purpose:** 6-feature grid showcasing platform capabilities

**Features:**
- Badge header
- 2-column grid on tablets, 3-column on desktop
- Feature cards with icons
- Icon scaling on hover
- Title and description per feature

**Props:** None
**State:** None
**Interactive:** Hover effects - scale icon, change border

**Features Shown:**
1. AI Content Rewriting (Sparkles)
2. 5 Beautiful Templates (Layout)
3. Newsletter System (Mail)
4. Social Media Auto-Posting (Share2)
5. Custom Domains (Globe)
6. SEO Optimization (TrendingUp)

#### SiteSlider.tsx
**Purpose:** Interactive pricing calculator on landing page

**Features:**
- Slider input (1-20 sites)
- Real-time price calculation ($49/site)
- Site count display
- Total monthly cost display with animation
- Price breakdown grid (per site, quantity, setup, total)
- Feature checklist (8 items)
- Dynamic button text based on selection
- Free trial CTA

**Props:** None
**State:**
- `siteCount` (number) - currently selected site count

**Interactive:** Yes
- Slider drag/click to change value
- Real-time updates
- Button text changes with site count

**Calculation:** `totalPrice = siteCount × 49`

#### Testimonials.tsx
**Purpose:** Social proof with 3 customer testimonials

**Features:**
- 3-column grid (responsive to 1 column on mobile)
- 5-star rating display
- Quote text
- Avatar with initials
- Author name and company
- Role information
- Hover effects on cards

**Props:** None
**State:** None
**Interactive:** Hover - border color change

**Testimonial Data:**
```
Sarah Chen - Digital Insights Pro (Founder)
Marcus Williams - Tech Authority Media (Content Director)
Elena Rodriguez - Health & Wellness Syndicate (CEO)
```

#### FAQ.tsx
**Purpose:** 6-item accordion with common questions

**Features:**
- Accordion-style expand/collapse
- ChevronDown icon with rotation animation
- Q&A pairs
- State management for open item
- Smooth transitions
- Border separation

**Props:** None
**State:**
- `openIndex` (number | null) - which FAQ item is open

**Interactive:** Yes
- Click to expand/collapse
- Icon rotates on open
- Smooth animation

**Questions:**
1. How does the AI content rewriting work?
2. Can I use my own custom domain?
3. What RSS sources can I add?
4. Is there a limit to how many articles I can publish?
5. What if I want to pause my sites?
6. Do you offer customer support?

#### FinalCTA.tsx
**Purpose:** Final email capture and call-to-action section

**Features:**
- Large headline
- Supporting copy
- Email input field with validation
- Submit button with arrow icon
- Success feedback animation
- Trust indicators at bottom
- Gradient background accent

**Props:** None
**State:**
- `email` (string) - form input
- `submitted` (boolean) - success feedback

**Interactive:** Yes
- Email input
- Form submission
- Success message shows 3 seconds

### Pricing Page Components

#### PricingHero.tsx
**Purpose:** Heading and intro for pricing page

**Features:**
- Badge header
- Large headline
- Two lines of supporting copy
- Centered layout

**Props:** None
**State:** None
**Interactive:** No

#### PricingSlider.tsx
**Purpose:** Detailed interactive pricing calculator on pricing page

**Features:**
- Left sidebar (sticky) with slider
- Right column with features list
- Site count selection (1-20)
- Real-time price calculation
- Price breakdown in box
- CTA button with dynamic text
- Feature checklist (12 items)
- Enterprise pricing note

**Props:** None
**State:**
- `siteCount` (number) - currently selected

**Interactive:** Yes
- Slider for site selection
- Button text updates
- Price updates in real-time

#### PricingComparison.tsx
**Purpose:** Plan comparison and feature matrix

**Features:**
- 3 pre-built plan cards (Starter, Growth, Scale)
- Growth plan highlighted as "Most Popular"
- Plan cards with pricing, description, button
- Feature comparison table
- Check/X icons for feature availability
- Responsive table with scrolling on mobile

**Props:** None
**State:** None
**Interactive:** Minimal - buttons link to signup

**Plans:**
```
Starter (1 site, $49/mo)  [normal]
Growth (5 sites, $245/mo) [highlighted]
Scale (10 sites, $490/mo) [normal]
```

**Features in Table (9 total):**
- AI Content Rewriting (all)
- Beautiful Templates (all)
- Custom Domain (all)
- Newsletter System (all)
- Social Media Auto-Posting (all)
- Email Support (all)
- API Access (Scale only)
- Priority Support (Growth+)
- Dedicated Account Manager (Scale only)

#### PricingFAQ.tsx
**Purpose:** Pricing-specific frequently asked questions

**Features:**
- Badge header
- 6 accordion items (like FAQ component)
- Same expand/collapse functionality
- Bottom "Contact Sales" CTA
- Email link for support

**Props:** None
**State:**
- `openIndex` (number | null) - open item

**Interactive:** Yes - accordion expansion

**Questions:**
1. Can I change my plan anytime?
2. Is there a setup fee?
3. What payment methods do you accept?
4. Do you offer annual pricing?
5. Can I try before I buy?
6. What if I need more than 20 sites?

## Styling Patterns

### Color Classes Used
```
Background:     bg-slate-950, bg-slate-900, bg-slate-800/50
Text:           text-white, text-slate-300, text-slate-400
Accent:         from-blue-600, to-purple-600
Success:        text-green-500
Yellow:         text-yellow-500 (stars)
```

### Responsive Breakpoints
```
Mobile:         < 640px (sm)
Tablet:         640px - 768px (md)
Desktop:        768px+ (lg)
```

### Card Patterns
```
Base:           bg-slate-800/50 border-slate-700
Hover:          hover:border-blue-600
Interactive:    hover:shadow-lg hover:shadow-blue-600/10
```

### Button Patterns
```
Primary:        bg-gradient-to-r from-blue-600 to-purple-600
Hover:          hover:from-blue-700 hover:to-purple-700
Secondary:      border border-slate-700 hover:bg-slate-900
```

## State Management

All components use React `useState` hook. No external state management needed.

**Components with State:**
- `Navbar` - mobile menu visibility
- `SiteSlider` - site count selection
- `FAQ` - open accordion item
- `FinalCTA` - email input + success feedback
- `PricingSlider` - site count selection
- `PricingFAQ` - open accordion item

## Integration Points

### Links
- `/auth/signup` - Get Started buttons
- `/auth/login` - Login buttons
- `/pricing` - Pricing page link
- `#how-it-works` - Anchor links
- `#features` - Anchor links
- `#faq` - Anchor links

### External Links
- Social media (Twitter, GitHub, LinkedIn)
- Email (hello@productionhouse.com)

## Accessibility Features

- Semantic HTML (section, button, nav)
- ARIA labels on icon-only buttons
- Alt text considerations (lucide icons are already accessible)
- Tab navigation support
- Mobile-friendly touch targets (48px+ buttons)
- Color contrast compliance
- Keyboard navigation (buttons, links, inputs)

## Performance Considerations

- No external animation libraries
- CSS-based transitions only
- Minimal re-renders (components are client-side where needed)
- Lazy image loading (when images are added)
- SVG icons (lucide-react)
- No heavy dependencies

## Common Component Patterns

### Section Structure
```tsx
<section className="py-20 px-4">
  <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="text-center mb-16">
      <Badge>Label</Badge>
      <h2>Heading</h2>
      <p>Subheading</p>
    </div>

    {/* Content Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Items */}
    </div>
  </div>
</section>
```

### Card Pattern
```tsx
<Card className="bg-slate-800/50 border-slate-700 p-8 hover:border-blue-600 transition-colors">
  {/* Icon */}
  <Icon className="w-6 h-6 text-blue-400 mb-4" />

  {/* Title */}
  <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>

  {/* Description */}
  <p className="text-slate-300">{description}</p>
</Card>
```

### Button Pattern
```tsx
<Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
  {children}
</Button>
```

## Migration/Extension Tips

If you need to modify or extend:

1. **Add a new section to home:**
   - Create component in `/components/marketing/`
   - Import in `/app/(marketing)/page.tsx`
   - Add to main element

2. **Add a new pricing plan:**
   - Modify `plans` array in `PricingComparison.tsx`
   - Update comparison logic

3. **Change colors:**
   - Update gradient classes (blue-600, purple-600)
   - Maintain consistency across components

4. **Modify pricing formula:**
   - Edit `pricePerSite` constant in SiteSlider components
   - Update display text

5. **Add testimonials:**
   - Modify `testimonials` array in `Testimonials.tsx`
   - Keep consistent structure

6. **Update FAQ:**
   - Modify `faqs` arrays in FAQ and PricingFAQ components
   - Keep Q&A format

## Testing Checklist

- [ ] Mobile responsive (test on 320px, 768px, 1024px)
- [ ] All links functional
- [ ] Slider interaction works smoothly
- [ ] Accordion expand/collapse
- [ ] Mobile menu toggle
- [ ] Form submission (email capture)
- [ ] No console errors
- [ ] Images load properly
- [ ] Animations smooth
- [ ] Text readable
- [ ] Buttons clickable
- [ ] Color contrast adequate
