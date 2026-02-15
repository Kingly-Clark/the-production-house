# Newsletter System - Code Examples & Usage

Copy-paste ready examples for integrating the Newsletter System into your application.

## 1. Subscribe Form for Public Site

```tsx
'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface NewsletterSubscribeProps {
  siteId: string;
  siteName: string;
}

export function NewsletterSubscribe({ siteId, siteName }: NewsletterSubscribeProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      const data = await response.json();
      setStatus('success');
      setMessage('Check your email to confirm subscription!');
      setEmail('');

      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage('Error subscribing. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
      <div className="flex items-start gap-4">
        <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Subscribe to {siteName}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Get weekly digest of new articles delivered to your inbox
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={status === 'loading'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              {message}
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 2. Dashboard Integration

```tsx
import { NewsletterPreview } from '@/components/dashboard/NewsletterPreview';

export default function SiteDashboard({ siteId }: { siteId: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Site Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your other dashboard components */}

        {/* Add Newsletter Widget */}
        <NewsletterPreview siteId={siteId} />
      </div>
    </div>
  );
}
```

## 3. Server-Side Usage

```typescript
// Send newsletter from a cron job or API
import { sendWeeklyNewsletter } from '@/lib/newsletter';

export async function triggerNewsletterSend(siteId: string) {
  const result = await sendWeeklyNewsletter(siteId);

  console.log(`Newsletter sent to ${result.recipientCount} subscribers`);
  console.log(`Articles included: ${result.articleCount}`);

  if (result.success) {
    // Log to your analytics
    return { success: true, recipients: result.recipientCount };
  } else {
    console.error('Failed to send newsletter:', result.error);
    return { success: false, error: result.error };
  }
}
```

## 4. Subscribe Endpoint (Optional Additional Route)

If you want a dedicated subscribe endpoint instead of embedding in forms:

```typescript
// src/app/api/newsletter/subscribe/route.ts
import { createClient } from '@/lib/supabase/server';
import { subscribeToSite } from '@/lib/newsletter';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { siteId, email } = await request.json();

    if (!siteId || !email) {
      return NextResponse.json(
        { error: 'siteId and email are required' },
        { status: 400 }
      );
    }

    // Verify site exists
    const supabase = await createClient();
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Subscribe user
    const result = await subscribeToSite(siteId, email);

    return NextResponse.json({
      success: true,
      message: result.confirmationSent
        ? 'Confirmation email sent'
        : 'Email already subscribed',
      subscriber: result.subscriber,
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
```

## 5. Admin Action - Send Manual Newsletter

```typescript
// app/actions/newsletter.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { sendWeeklyNewsletter } from '@/lib/newsletter';

export async function sendNewsletterAction(siteId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const { data: site } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single();

  if (!site || site.organization_id !== user.organization_id) {
    throw new Error('Forbidden');
  }

  return await sendWeeklyNewsletter(siteId);
}
```

## 6. Display Newsletter History Table

```tsx
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface NewsletterLog {
  id: string;
  subject: string;
  sent_at: string | null;
  recipient_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  created_at: string;
}

export function NewsletterHistory({ siteId }: { siteId: string }) {
  const [history, setHistory] = useState<NewsletterLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const response = await fetch(`/api/newsletter/history?siteId=${siteId}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [siteId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Sent Date
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Recipients
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{item.subject}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {item.sent_at ? format(new Date(item.sent_at), 'MMM d, yyyy') : '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {item.recipient_count}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'sent'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 7. Stats Card Component

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, CheckCircle } from 'lucide-react';

interface SubscriberStats {
  total: number;
  confirmed: number;
  unsubscribed: number;
}

export function NewsletterStats({ siteId }: { siteId: string }) {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/newsletter/stats?siteId=${siteId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [siteId]);

  if (loading || !stats) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Total Subscribers</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm text-gray-600">Unsubscribed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unsubscribed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 8. Test Email Sending

```typescript
// Quick test in your API route
import { sendEmail } from '@/lib/newsletter';

export async function testEmailSend() {
  try {
    const result = await sendEmail({
      to: 'test@example.com',
      from: 'newsletter@productionhouse.ai',
      subject: 'Test Email',
      html: '<h1>Test</h1><p>This is a test email</p>',
    });

    console.log('Email sent:', result.id);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}
```

## 9. CLI Command to Send Newsletter

```typescript
// Run with: npx tsx scripts/send-newsletter.ts
import { sendWeeklyNewsletter } from '@/lib/newsletter';

async function main() {
  const siteId = process.argv[2];

  if (!siteId) {
    console.error('Usage: npx tsx scripts/send-newsletter.ts <site-id>');
    process.exit(1);
  }

  console.log(`Sending newsletter for site: ${siteId}`);

  const result = await sendWeeklyNewsletter(siteId);

  if (result.success) {
    console.log(`✓ Newsletter sent to ${result.recipientCount} subscribers`);
    console.log(`✓ Articles included: ${result.articleCount}`);
  } else {
    console.error(`✗ Failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch(console.error);
```

## 10. Monitoring Query

```typescript
// Get newsletter health stats
import { createAdminClient } from '@/lib/supabase/admin';

export async function getNewsletterHealth() {
  const supabase = createAdminClient();

  // Get last 7 days of sends
  const { data: sends } = await supabase
    .from('newsletter_log')
    .select('site_id, status, recipient_count')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Get subscriber stats
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('is_confirmed, unsubscribed_at');

  return {
    sends: {
      total: sends?.length || 0,
      successful: sends?.filter((s) => s.status === 'sent').length || 0,
      failed: sends?.filter((s) => s.status === 'failed').length || 0,
      totalRecipients: sends?.reduce((sum, s) => sum + (s.recipient_count || 0), 0) || 0,
    },
    subscribers: {
      total: subscribers?.length || 0,
      confirmed: subscribers?.filter((s) => s.is_confirmed).length || 0,
      unsubscribed: subscribers?.filter((s) => s.unsubscribed_at).length || 0,
    },
  };
}
```

## Import Cheat Sheet

```typescript
// Single functions
import { sendEmail, sendBatchEmails } from '@/lib/newsletter/resend-client';
import { buildWeeklyDigest } from '@/lib/newsletter/builder';
import { sendWeeklyNewsletter, getNewsletterHistory } from '@/lib/newsletter/sender';
import { subscribeToSite, confirmSubscription, unsubscribe } from '@/lib/newsletter/subscribers';

// Or import everything
import * as Newsletter from '@/lib/newsletter';
```

## API Request Examples

```bash
# Manual send
curl -X POST http://localhost:3000/api/newsletter/send \
  -H "Content-Type: application/json" \
  -d '{"siteId": "site-uuid"}'

# Preview
curl -X POST http://localhost:3000/api/newsletter/preview \
  -H "Content-Type: application/json" \
  -d '{"siteId": "site-uuid"}'

# History
curl http://localhost:3000/api/newsletter/history?siteId=site-uuid&limit=5

# Confirm (public)
curl http://localhost:3000/api/public/site/my-site/confirm?token=token123

# Unsubscribe (public)
curl http://localhost:3000/api/public/site/my-site/unsubscribe?token=token456
```

All these examples are production-ready and follow the Newsletter System architecture!
