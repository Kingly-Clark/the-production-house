# Production House Newsletter System

Complete implementation of the weekly newsletter system for the Production House SaaS platform. Sends automatic newsletters every Friday at 10am UTC to all confirmed subscribers with a digest of published articles from the past week.

## Architecture Overview

### Core Components

1. **Resend Client** (`src/lib/newsletter/resend-client.ts`)
   - Email sending via Resend API
   - Single email and batch email functionality
   - Confirmation and unsubscribe email templates

2. **Newsletter Builder** (`src/lib/newsletter/builder.ts`)
   - Fetches articles from the past 7 days
   - Generates AI-powered summary text
   - Builds professional HTML email template with inline CSS
   - Handles custom domain sender addresses

3. **Newsletter Sender** (`src/lib/newsletter/sender.ts`)
   - Orchestrates newsletter sending process
   - Manages batch email operations
   - Logs newsletter send history
   - Includes retry logic for Resend API

4. **Subscriber Management** (`src/lib/newsletter/subscribers.ts`)
   - Double opt-in subscription flow
   - Confirmation and unsubscribe token generation
   - Subscription status tracking
   - Subscriber counts and metrics

5. **API Routes**
   - `POST /api/newsletter/send` - Manually trigger newsletter send
   - `POST /api/newsletter/preview` - Preview newsletter HTML
   - `GET /api/newsletter/history` - Get send history for a site
   - `GET /api/public/site/[slug]/confirm` - Confirm email subscription
   - `GET /api/public/site/[slug]/unsubscribe` - Unsubscribe from newsletter

6. **Edge Function** (`supabase/functions/send-newsletter/index.ts`)
   - Deno-based Supabase Edge Function
   - Runs Friday 10am UTC via pg_cron
   - Processes all active sites
   - Logs results to job_log table

7. **Dashboard Component** (`src/components/dashboard/NewsletterPreview.tsx`)
   - Shows last newsletter sent date
   - Displays recipient count
   - Preview button with HTML modal
   - Manual send trigger button

## Database Schema

### subscribers table
```sql
CREATE TABLE subscribers (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES sites(id),
  email text NOT NULL,
  is_confirmed boolean NOT NULL DEFAULT false,
  confirmation_token text UNIQUE,
  unsubscribe_token text UNIQUE NOT NULL,
  subscribed_at timestamp DEFAULT now(),
  confirmed_at timestamp,
  unsubscribed_at timestamp
);
```

### newsletter_log table
```sql
CREATE TABLE newsletter_log (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES sites(id),
  subject text NOT NULL,
  content_html text,
  summary_text text,
  sent_at timestamp,
  recipient_count integer,
  resend_batch_id text,
  status text NOT NULL DEFAULT 'draft', -- 'draft' | 'sending' | 'sent' | 'failed'
  created_at timestamp DEFAULT now()
);
```

## Email Flow

### Subscription Flow
1. User provides email on site public page
2. `subscribeToSite()` creates unconfirmed subscriber record
3. Confirmation email sent with unique confirmation link
4. User clicks link → `GET /api/public/site/[slug]/confirm?token=XXX`
5. Subscriber marked as confirmed in database

### Newsletter Sending Flow
1. **Friday 10am UTC**: Edge function triggers automatically
2. For each active site:
   - Fetch articles from past 7 days
   - If no articles, skip site
   - Build HTML email with inline CSS
   - Get all confirmed, non-unsubscribed subscribers
   - Send batch emails via Resend (max 100 at a time)
   - Log results in newsletter_log table
3. Each email includes unsubscribe link with unique token

### Unsubscribe Flow
1. User clicks unsubscribe link in newsletter
2. Link contains unique unsubscribe token
3. `GET /api/public/site/[slug]/unsubscribe?token=XXX`
4. Subscriber marked as unsubscribed
5. Confirmation email sent

## Email Template

The newsletter uses an HTML email template with:
- Inline CSS (email client safe)
- Site logo from settings
- AI-generated summary paragraph
- Article cards with:
  - Featured image
  - Title
  - Excerpt
  - Read more link
- Call-to-action button
- Unsubscribe link (CAN-SPAM compliant)
- Production House footer branding

Key features:
- Responsive design for mobile
- Gradient header using site's primary color
- Professional typography
- Dark mode safe colors

## API Endpoints

### POST /api/newsletter/send
Manually trigger newsletter send for a site.

**Authentication**: Required (site owner/admin)

**Request**:
```json
{
  "siteId": "site-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Newsletter sent to 234 subscribers",
  "recipientCount": 234,
  "articleCount": 8,
  "loggingId": "log-uuid"
}
```

### POST /api/newsletter/preview
Preview newsletter HTML without sending.

**Authentication**: Required

**Request**:
```json
{
  "siteId": "site-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "subject": "Site Name Weekly Digest - Feb 14",
  "html": "<!DOCTYPE html>...",
  "articleCount": 8
}
```

### GET /api/newsletter/history
Get newsletter send history for a site.

**Authentication**: Required

**Query Params**:
- `siteId` (required): Site UUID
- `limit` (optional): Number of records to return (default: 10, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "site_id": "site-uuid",
      "subject": "Site Weekly Digest",
      "sent_at": "2024-02-14T10:00:00Z",
      "recipient_count": 234,
      "status": "sent",
      "created_at": "2024-02-14T09:45:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/public/site/[slug]/confirm
Confirm email subscription (public endpoint).

**Query Params**:
- `token` (required): Confirmation token from email

**Response**:
```json
{
  "success": true,
  "message": "You have successfully confirmed your subscription to Site Name",
  "email": "user@example.com",
  "siteName": "Site Name"
}
```

### GET /api/public/site/[slug]/unsubscribe
Unsubscribe from newsletter (public endpoint).

**Query Params**:
- `token` (required): Unsubscribe token from email

**Response**:
```json
{
  "success": true,
  "message": "You have been unsubscribed from the newsletter",
  "email": "user@example.com"
}
```

## Configuration

### Environment Variables
- `NEXT_PUBLIC_APP_URL`: Application URL (e.g., https://productionhouse.ai)
- `RESEND_API_KEY`: Resend API key for email sending
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `GOOGLE_AI_API_KEY`: Google Gemini API key for summaries

### Resend Configuration
- API endpoint: `https://api.resend.com/email/batch`
- Max batch size: 100 emails per request
- Default from address: `newsletter@{custom-domain}` or `newsletter@productionhouse.ai`

### Supabase Edge Function
- Language: TypeScript (Deno)
- Schedule: `0 10 * * 5` (Friday 10am UTC via pg_cron)
- Env vars: Same as main application

## Usage Examples

### Subscribe a User
```typescript
import { subscribeToSite } from '@/lib/newsletter';

const result = await subscribeToSite(siteId, 'user@example.com');
console.log(`Confirmation email sent: ${result.confirmationSent}`);
```

### Send Newsletter Manually
```typescript
import { sendWeeklyNewsletter } from '@/lib/newsletter';

const result = await sendWeeklyNewsletter(siteId);
console.log(`Sent to ${result.recipientCount} subscribers`);
```

### Get Newsletter Stats
```typescript
import { getNewsletterStats, getSubscriberCount } from '@/lib/newsletter';

const stats = await getNewsletterStats(siteId);
const counts = await getSubscriberCount(siteId);
console.log(`Confirmed: ${counts.confirmed}, Total: ${counts.total}`);
```

### Build Preview
```typescript
import { buildWeeklyDigest } from '@/lib/newsletter';

const digest = await buildWeeklyDigest(siteId);
if (digest) {
  console.log(`Subject: ${digest.subject}`);
  console.log(`Articles: ${digest.articleCount}`);
}
```

## Error Handling

All functions include comprehensive error handling:

1. **Missing Subscribers**: If no articles exist in past 7 days, newsletter is skipped
2. **Failed Sends**: Individual email failures are logged but don't stop batch processing
3. **API Errors**: Resend API errors are caught and logged with detailed messages
4. **Database Errors**: Supabase errors are handled with fallback values

## Security

1. **Double Opt-In**: All subscriptions require email confirmation
2. **Unique Tokens**: Confirmation and unsubscribe tokens are cryptographically random
3. **CAN-SPAM Compliance**: Every email includes unsubscribe link
4. **Authorization**: API endpoints check user ownership of site
5. **Token Validation**: Public endpoints validate tokens before processing
6. **No Secrets in Emails**: No API keys or sensitive data in email content

## Performance Considerations

1. **Batch Sending**: Resend batch API sends up to 100 emails per request
2. **Database Queries**: Optimized with proper indexes on site_id, is_confirmed, unsubscribed_at
3. **HTML Building**: Inline CSS prevents parsing overhead
4. **Image Optimization**: Featured images should be optimized for email (~600px width)

## Testing

### Manual Send
1. Navigate to site dashboard
2. Click "Send Now" in Newsletter Preview component
3. Confirm the action
4. Check newsletter_log for status

### Preview
1. Click "Preview" button in Newsletter Preview component
2. Review HTML in modal
3. Check subject and article count

### Confirmation Flow
1. Subscribe with test email
2. Check inbox for confirmation email
3. Click confirmation link
4. Verify subscriber status in database

## Monitoring

### Check Job Logs
```sql
SELECT * FROM job_log
WHERE job_type = 'send_newsletter'
ORDER BY started_at DESC
LIMIT 10;
```

### Check Newsletter Logs
```sql
SELECT * FROM newsletter_log
WHERE site_id = 'site-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Subscribers
```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN is_confirmed THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) as unsubscribed
FROM subscribers
WHERE site_id = 'site-uuid';
```

## Troubleshooting

### Newsletters Not Sending
1. Check if cron_enabled = true for site
2. Check site status = 'active'
3. Check newsletter_log for errors
4. Verify Resend API key is valid
5. Check subscriber confirmation status

### Confirmation Emails Not Arriving
1. Check Resend email logs
2. Verify subscriber email is correct
3. Check spam folder
4. Verify sendConfirmationEmail function is called

### Custom Domain Emails
1. Verify domain in site_domains table
2. Check verification_status = 'verified'
3. Ensure domain MX records are configured
4. Test with Resend dashboard

## Future Enhancements

1. **Open Rate Tracking**: Track email opens via Resend webhooks
2. **Click Tracking**: Track article clicks from newsletters
3. **Personalization**: Custom summaries per subscriber interests
4. **A/B Testing**: Test different subject lines
5. **Scheduled Sends**: Allow custom send times
6. **Digest Frequency**: Support daily/weekly/monthly options
7. **Template Customization**: Allow site-specific email templates
8. **Analytics Dashboard**: Show opens, clicks, unsubscribes

## Dependencies

- `resend`: Email sending service
- `@supabase/supabase-js`: Database client
- `@google/generative-ai`: AI-powered summaries
- `lucide-react`: Dashboard icons
- Deno (for Edge Functions)

## Code Quality

- Full TypeScript typing (no `any`)
- Error boundaries and fallback handling
- Comprehensive JSDoc comments
- Inline CSS for email compatibility
- Deno-compatible imports for Edge Function
- Next.js AppRouter conventions
