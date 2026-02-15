# Newsletter System Integration Guide

Quick reference for integrating the Newsletter System into the Production House application.

## Files Created

### Core Library Files
- `src/lib/newsletter/resend-client.ts` - Resend API client
- `src/lib/newsletter/builder.ts` - Newsletter HTML builder
- `src/lib/newsletter/sender.ts` - Newsletter sending orchestration
- `src/lib/newsletter/subscribers.ts` - Subscriber management
- `src/lib/newsletter/index.ts` - Module exports

### API Routes
- `src/app/api/newsletter/send/route.ts` - POST: Manual send
- `src/app/api/newsletter/preview/route.ts` - POST: HTML preview
- `src/app/api/newsletter/history/route.ts` - GET: Send history
- `src/app/api/public/site/[slug]/confirm/route.ts` - GET: Confirm subscription
- `src/app/api/public/site/[slug]/unsubscribe/route.ts` - GET: Unsubscribe

### Edge Function
- `supabase/functions/send-newsletter/index.ts` - Deno edge function

### UI Component
- `src/components/dashboard/NewsletterPreview.tsx` - Dashboard widget

### Documentation
- `NEWSLETTER_SYSTEM.md` - Complete system documentation
- `NEWSLETTER_INTEGRATION.md` - This file

## Quick Start

### 1. Install Dependencies
```bash
npm install resend
# Already installed: @supabase/supabase-js, @google/generative-ai
```

### 2. Set Environment Variables
Add to `.env.local`:
```
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Other vars already configured
```

### 3. Database Setup
```sql
-- Create subscribers table (if not exists)
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_confirmed boolean NOT NULL DEFAULT false,
  confirmation_token text UNIQUE,
  unsubscribe_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  subscribed_at timestamp NOT NULL DEFAULT now(),
  confirmed_at timestamp,
  unsubscribed_at timestamp,
  UNIQUE(site_id, email)
);

-- Create newsletter_log table (if not exists)
CREATE TABLE IF NOT EXISTS newsletter_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content_html text,
  summary_text text,
  sent_at timestamp,
  recipient_count integer NOT NULL DEFAULT 0,
  resend_batch_id text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_subscribers_site_confirmed ON subscribers(site_id, is_confirmed, unsubscribed_at);
CREATE INDEX idx_newsletter_log_site ON newsletter_log(site_id, created_at);
```

### 4. Add to Dashboard
In your site dashboard page, add the NewsletterPreview component:

```tsx
import { NewsletterPreview } from '@/components/dashboard/NewsletterPreview';

export default function SiteDashboard({ siteId }: { siteId: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Other components */}
      <NewsletterPreview siteId={siteId} />
    </div>
  );
}
```

### 5. Add Subscribe Form to Public Site
```tsx
import { subscribeToSite } from '@/lib/newsletter';
import { useState } from 'react';

export function NewsletterSubscribe({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await subscribeToSite(siteId, email);
      if (result.confirmationSent) {
        setMessage('Check your email to confirm subscription!');
        setEmail('');
      } else {
        setMessage('Email already confirmed for this site');
      }
    } catch (error) {
      setMessage('Error subscribing. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Subscribing...' : 'Subscribe'}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}
```

## Email Sending via Resend

### API Key
1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys
3. Create new API key
4. Add to environment variables

### Sender Address
- Default: `newsletter@productionhouse.ai`
- Custom: `newsletter@your-custom-domain.com` (if domain verified)

### Test Sending
```bash
curl --request POST \
  --url https://api.resend.com/emails \
  --header 'Authorization: Bearer YOUR_RESEND_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "from": "newsletter@productionhouse.ai",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<h1>Test</h1>"
  }'
```

## Edge Function Setup

### Deploy to Supabase
```bash
# Make sure you're authenticated with Supabase CLI
supabase functions deploy send-newsletter --no-verify-jwt
```

### Schedule via pg_cron
```sql
-- In Supabase SQL Editor, run:
-- This schedules the function to run every Friday at 10:00 AM UTC
SELECT cron.schedule(
  'send-newsletters',
  '0 10 * * 5',  -- 10am Friday
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_ID.functions.supabase.co/send-newsletter',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

### Monitor Edge Function
1. Go to Supabase Dashboard
2. Navigate to Functions → send-newsletter
3. Check Invocations tab for logs

## Testing Checklist

- [ ] Install resend package
- [ ] Add RESEND_API_KEY to environment
- [ ] Create database tables and indexes
- [ ] Test subscribe endpoint with POST request
- [ ] Test confirmation email arrives
- [ ] Click confirmation link and verify subscriber marked confirmed
- [ ] Test newsletter preview endpoint
- [ ] Test manual send endpoint
- [ ] Check newsletter_log table for records
- [ ] Test unsubscribe link
- [ ] Verify unsubscribed_at is set
- [ ] Check Resend dashboard for email logs
- [ ] Deploy edge function to Supabase
- [ ] Test edge function with manual invocation
- [ ] Add NewsletterPreview component to dashboard
- [ ] Add subscribe form to public site page

## Common Issues

### "RESEND_API_KEY is required"
- Add RESEND_API_KEY to environment variables
- Restart development server

### "No articles found for site"
- Publish at least one article in the past 7 days
- Check article status = 'published'
- Check published_at timestamp

### "No confirmed subscribers"
- Subscribe with test email
- Click confirmation link in email
- Verify is_confirmed = true in database

### "Unsubscribe token invalid"
- Check unsubscribe_token is generated for subscriber
- Verify token matches URL parameter exactly

### "Custom domain not working"
- Verify domain in site_domains table
- Check verification_status = 'verified'
- Confirm MX records are set up

## API Usage Examples

### From Frontend
```typescript
// Subscribe
const res = await fetch('/api/newsletter/subscribe', {
  method: 'POST',
  body: JSON.stringify({ siteId, email })
});

// Send newsletter
const res = await fetch('/api/newsletter/send', {
  method: 'POST',
  body: JSON.stringify({ siteId })
});

// Preview
const res = await fetch('/api/newsletter/preview', {
  method: 'POST',
  body: JSON.stringify({ siteId })
});

// History
const res = await fetch(`/api/newsletter/history?siteId=${siteId}`);
```

### From Server-Side
```typescript
import {
  sendWeeklyNewsletter,
  subscribeToSite,
  getNewsletterStats
} from '@/lib/newsletter';

const result = await sendWeeklyNewsletter(siteId);
await subscribeToSite(siteId, email);
const stats = await getNewsletterStats(siteId);
```

## Monitoring & Analytics

### Check Sending Logs
```sql
SELECT * FROM newsletter_log
WHERE site_id = 'site-uuid'
ORDER BY created_at DESC;
```

### Check Subscriber Health
```sql
SELECT
  COUNT(*) total,
  COUNT(CASE WHEN is_confirmed THEN 1 END) confirmed,
  COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) unsubscribed
FROM subscribers
WHERE site_id = 'site-uuid';
```

### Monitor Job Execution
```sql
SELECT * FROM job_log
WHERE job_type = 'send_newsletter'
ORDER BY started_at DESC;
```

## Production Deployment

1. **Environment Variables**: Set all required vars in deployment platform
2. **Database**: Run migrations on production database
3. **Edge Function**: Deploy with `supabase functions deploy`
4. **Email Verification**: Set up SPF, DKIM, DMARC records
5. **Testing**: Send test newsletters before going live
6. **Monitoring**: Set up alerts for failed sends
7. **Backup**: Schedule database backups

## Support & Debugging

### Enable Debug Logging
All functions include `console.error()` statements that appear in:
- Vercel Functions dashboard (for API routes)
- Supabase Functions dashboard (for edge function)
- Browser console (for client-side code)

### Common Environment Issues
- Verify `NEXT_PUBLIC_APP_URL` is correct (used in email links)
- Check Resend API key format (should be long string)
- Ensure Supabase credentials are valid
- Verify database tables exist with correct schema

### Performance Tips
- Limit newsletter articles to 10 per email
- Optimize featured images to ~600px width, < 100KB
- Use batching for large subscriber lists
- Monitor Resend quota usage
