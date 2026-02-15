# Production House Newsletter System

Complete weekly newsletter system for sending automated digests to subscribers every Friday at 10am UTC.

## 📋 Documentation Index

Read these in order:

1. **[NEWSLETTER_BUILD_SUMMARY.md](NEWSLETTER_BUILD_SUMMARY.md)** ⭐ START HERE
   - High-level overview of what was built
   - Architecture summary
   - All critical requirements met
   - ~450 lines

2. **[NEWSLETTER_SYSTEM.md](NEWSLETTER_SYSTEM.md)**
   - Complete technical documentation
   - Database schema with SQL
   - All API endpoints documented
   - Email flows and templates
   - ~415 lines

3. **[NEWSLETTER_INTEGRATION.md](NEWSLETTER_INTEGRATION.md)**
   - Step-by-step setup guide
   - Database migrations
   - Deployment instructions
   - Testing checklist
   - Common issues & solutions
   - ~345 lines

4. **[NEWSLETTER_CODE_EXAMPLES.md](NEWSLETTER_CODE_EXAMPLES.md)**
   - Copy-paste ready code examples
   - Integration patterns
   - API usage examples
   - ~520 lines

## 📁 File Structure

```
src/lib/newsletter/
├── resend-client.ts        # Email API integration
├── builder.ts              # Newsletter HTML generation
├── sender.ts               # Newsletter sending logic
├── subscribers.ts          # Subscriber management
└── index.ts                # Module exports

src/app/api/
├── newsletter/
│   ├── send/route.ts       # POST: Manual send
│   ├── preview/route.ts    # POST: Preview HTML
│   └── history/route.ts    # GET: Send history
└── public/site/[slug]/
    ├── confirm/route.ts    # GET: Confirm subscription
    └── unsubscribe/route.ts # GET: Unsubscribe

src/components/dashboard/
└── NewsletterPreview.tsx   # Dashboard widget

supabase/functions/
└── send-newsletter/
    └── index.ts            # Friday 10am UTC cron job

Documentation Files
├── NEWSLETTER_README.md           # This file
├── NEWSLETTER_BUILD_SUMMARY.md    # Project overview
├── NEWSLETTER_SYSTEM.md           # Technical docs
├── NEWSLETTER_INTEGRATION.md      # Setup guide
└── NEWSLETTER_CODE_EXAMPLES.md    # Code examples
```

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install resend
```

### 2. Add Environment Variable
```bash
# .env.local
RESEND_API_KEY=your_api_key_from_resend.com
```

### 3. Create Database Tables
```sql
-- Copy from NEWSLETTER_INTEGRATION.md section "Database Setup"
-- Run in Supabase SQL Editor
```

### 4. Deploy Edge Function
```bash
supabase functions deploy send-newsletter --no-verify-jwt
```

### 5. Add to Dashboard
```tsx
import { NewsletterPreview } from '@/components/dashboard/NewsletterPreview';

// In your site dashboard page
<NewsletterPreview siteId={siteId} />
```

## 📧 Email Flow

### Subscribe
1. User enters email on site
2. Confirmation email sent
3. User clicks link to confirm
4. Status updated to confirmed

### Send (Every Friday 10am UTC)
1. Edge function triggers automatically
2. Fetches articles from past 7 days
3. Builds HTML with AI summary
4. Sends batch emails to all confirmed subscribers
5. Logs results to database

### Unsubscribe
1. User clicks unsubscribe link in email
2. Status updated to unsubscribed
3. Confirmation email sent

## 🔧 Key Functions

### Core Functions
```typescript
import {
  // Sending
  sendWeeklyNewsletter,     // Main function - sends to all confirmed subscribers
  sendNewsletterToEmails,   // Send to specific emails

  // Building
  buildWeeklyDigest,        // Generate HTML and subject

  // Managing Subscribers
  subscribeToSite,          // Create new subscription (double opt-in)
  confirmSubscription,      // Confirm via token
  unsubscribe,              // Unsubscribe via token

  // Stats
  getNewsletterHistory,     // Get past sends
  getSubscriberCount,       // Get subscriber stats
} from '@/lib/newsletter';
```

## 📊 API Endpoints

### Authenticated (Requires user + org ownership)
- `POST /api/newsletter/send` - Send now
- `POST /api/newsletter/preview` - Preview HTML
- `GET /api/newsletter/history` - Send history

### Public (Token-protected)
- `GET /api/public/site/[slug]/confirm?token=XXX` - Confirm
- `GET /api/public/site/[slug]/unsubscribe?token=XXX` - Unsubscribe

## 📈 Database Schema

### subscribers
- Stores subscription info
- Double opt-in with confirmation_token
- Tracks unsubscribe status
- Unique per site + email

### newsletter_log
- Stores send history
- Tracks recipient count
- Logs Resend batch ID
- Records send status

## 🔒 Security Features

✅ **Double Opt-In**: Confirmation required
✅ **Secure Tokens**: 64-character random hex strings
✅ **CAN-SPAM**: Unsubscribe link in every email
✅ **Authorization**: Owner verification for admin endpoints
✅ **Token Validation**: Public endpoints validate tokens

## 📋 Checklist for Going Live

- [ ] Install `resend` package
- [ ] Get RESEND_API_KEY from resend.com
- [ ] Set RESEND_API_KEY in environment
- [ ] Create database tables
- [ ] Deploy edge function
- [ ] Test subscribe flow
- [ ] Test confirmation email
- [ ] Test unsubscribe flow
- [ ] Test manual newsletter send
- [ ] Add component to dashboard
- [ ] Add form to public site
- [ ] Test end-to-end

## 🐛 Troubleshooting

### "Newsletter not sending"
→ Check cron_enabled = true on site
→ Check site status = 'active'
→ Check if articles exist in past 7 days
→ Check Resend dashboard for API key validity

### "Confirmation email not arriving"
→ Check Resend API key is valid
→ Check email address is correct
→ Check NEXT_PUBLIC_APP_URL environment var
→ Look in spam/junk folder

### "Custom domain not working"
→ Verify domain in site_domains table
→ Check verification_status = 'verified'
→ Ensure MX records configured

See **NEWSLETTER_INTEGRATION.md** for more troubleshooting.

## 📞 Support References

- **Resend API**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

## 📚 Documentation Files Overview

| File | Purpose | Read Time |
|------|---------|-----------|
| NEWSLETTER_BUILD_SUMMARY.md | Overview & what was built | 10 min |
| NEWSLETTER_SYSTEM.md | Technical architecture | 15 min |
| NEWSLETTER_INTEGRATION.md | Setup & deployment | 20 min |
| NEWSLETTER_CODE_EXAMPLES.md | Code patterns | 15 min |

## ✅ What's Included

### Code Files (13 total)
- ✅ 5 core library modules (1,056 lines)
- ✅ 5 API route handlers (335 lines)
- ✅ 1 Deno edge function (493 lines)
- ✅ 1 React dashboard component (261 lines)

### Documentation (4 files)
- ✅ Build summary (446 lines)
- ✅ Technical docs (415 lines)
- ✅ Integration guide (344 lines)
- ✅ Code examples (522 lines)

**Total**: ~4,000 lines of production-ready code and documentation

## 🎯 Features

### Email Features
- Professional HTML templates with inline CSS
- Responsive design (mobile-friendly)
- Site branding (logo, colors)
- Article cards with images
- AI-generated summaries
- Click tracking ready

### Functionality
- Double opt-in subscription
- Batch email sending (up to 100 per batch)
- Automatic retry logic
- Newsletter logging
- Subscriber statistics
- Unsubscribe tracking

### Automation
- Scheduled Friday 10am UTC sends
- Per-site error handling
- Job logging
- Health monitoring

## 🏗️ Architecture

```
┌─────────────────┐
│  Public Site    │
│ (Subscribe Form)│
└────────┬────────┘
         │
    ┌────▼──────────────┐
    │  API Routes       │
    │ (Confirmation,    │
    │  Unsubscribe)     │
    └──────────────────┘
         │
    ┌────▼─────────────────┐
    │  Core Library         │
    │ (Build, Send, Manage) │
    └──────────────────────┘
         │
    ┌────▼──────────────────┐
    │  Resend API           │
    │  Supabase Database    │
    └───────────────────────┘

Edge Function (Deno)
┌──────────────────────────┐
│ Friday 10am UTC Trigger  │
│ -> Fetch articles        │
│ -> Build HTML            │
│ -> Send batch emails     │
│ -> Log results           │
└──────────────────────────┘
```

## 🎓 Learning Path

1. Read **NEWSLETTER_BUILD_SUMMARY.md** to understand what was built
2. Read **NEWSLETTER_SYSTEM.md** to understand how it works
3. Follow **NEWSLETTER_INTEGRATION.md** to set it up
4. Reference **NEWSLETTER_CODE_EXAMPLES.md** when coding

## 📦 Dependencies

- `resend` - Email sending service
- `@supabase/supabase-js` - Database client (already installed)
- `@google/generative-ai` - AI summaries (already installed)
- `lucide-react` - Icons (already installed)

## 🚀 Next Steps

1. **Setup**: Follow NEWSLETTER_INTEGRATION.md
2. **Test**: Use testing checklist
3. **Deploy**: Deploy edge function
4. **Monitor**: Check logs regularly
5. **Iterate**: Customize templates as needed

## 📝 Notes

- All code is TypeScript (no `any` types)
- All code is production-ready
- Comprehensive error handling
- Full email compliance (CAN-SPAM)
- Security-first design
- Database-optimized queries

---

**Questions?** Check the troubleshooting section in NEWSLETTER_INTEGRATION.md or refer to the complete NEWSLETTER_SYSTEM.md documentation.

**Ready to deploy?** Start with the Quick Start section above, then follow NEWSLETTER_INTEGRATION.md for detailed setup.
