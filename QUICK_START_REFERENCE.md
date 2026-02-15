# Production House — Quick Start Reference

## Files Quick Lookup

| Component | Files | Purpose |
|-----------|-------|---------|
| Database Schema | `supabase/migrations/001_schema.sql` | 14 tables, indexes, triggers |
| RLS Policies | `supabase/migrations/002_rls.sql` | 72 security policies |
| Functions | `supabase/migrations/003_functions.sql` | Helper functions, user triggers |
| Browser Client | `src/lib/supabase/client.ts` | Safe for client-side code |
| Server Client | `src/lib/supabase/server.ts` | For server components |
| Admin Client | `src/lib/supabase/admin.ts` | Bypasses RLS (secure only!) |
| Auth Helpers | `src/lib/auth/helpers.ts` | Common auth operations |
| Middleware | `src/middleware.ts` | Route protection, session refresh |
| Login Page | `src/app/(auth)/login/page.tsx` | Email, magic link, OAuth |
| Signup Page | `src/app/(auth)/signup/page.tsx` | Registration flow |
| Auth Callback | `src/app/(auth)/callback/route.ts` | OAuth handler |
| Auth Layout | `src/app/(auth)/layout.tsx` | Shared auth UI |
| Root Layout | `src/app/layout.tsx` | App-wide setup |
| Global Styles | `src/app/globals.css` | Dark-mode theme |
| Environment | `.env.local.example` | Config template |

## Common Code Patterns

### Get Current User (Server Component)
```typescript
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';

export default async function Page() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello, {user.full_name}</div>;
}
```

### Protect Route (Server Component)
```typescript
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/auth/helpers';

export default async function AdminPage() {
  const supabase = await createClient();

  // Throws error if not authenticated
  await requireAuth(supabase);

  // Or throw if not admin
  await requireAdmin(supabase);

  return <div>Admin content</div>;
}
```

### Query with RLS (Server Component)
```typescript
const { data: sites, error } = await supabase
  .from('sites')
  .select('*');
  // ✅ RLS automatically filters to user's organization

const { data: articles, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published');
  // ✅ Returns all published articles (public read)
```

### Query with RLS (Client Component)
```typescript
'use client';

import { createClient } from '@/lib/supabase/client';

export function Component() {
  const supabase = createClient();

  const [sites, setSites] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sites')
        .select('*');
        // ✅ RLS filters automatically
      setSites(data || []);
    }
    load();
  }, []);

  return <div>{sites.map(site => ...)}</div>;
}
```

### Admin Operation (Route Handler)
```typescript
import { adminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Always check auth first!
  await requireAdmin(supabase);

  // Now use admin client for operation
  const { data, error } = await adminClient
    .from('admin_alerts')
    .insert({
      type: 'system',
      severity: 'info',
      message: 'Test alert'
    });

  return NextResponse.json(data);
}
```

### Protected API Route (Route Handler)
```typescript
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  await requireAuth(supabase);

  // Now user is authenticated
  const { data, error } = await supabase
    .from('sites')
    .select('*');

  return NextResponse.json(data);
}
```

## Environment Variables Setup

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your values
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs... (SECRET!)

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_... (SECRET!)
STRIPE_WEBHOOK_SECRET=whsec_...

GOOGLE_AI_API_KEY=... (SECRET!)
RESEND_API_KEY=re_... (SECRET!)
LATE_API_KEY=... (SECRET!)

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Commands

### Apply Migrations
```bash
# Using Supabase CLI
supabase link                    # Link to project
supabase db push                 # Push migrations

# Or manually in Supabase dashboard:
# SQL Editor → Paste 001_schema.sql → Run
# SQL Editor → Paste 002_rls.sql → Run
# SQL Editor → Paste 003_functions.sql → Run
```

### Check RLS Policies
```sql
-- View all policies
SELECT * FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test a policy (as anon user)
SELECT auth.uid();  -- Should be NULL

-- Get current auth info (in app)
SELECT auth.user_org_id();  -- User's org
SELECT auth.is_admin();     -- Admin check
```

### View User Sessions
```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;
```

## Common Queries

### Get Site Stats
```typescript
const { data: stats } = await supabase
  .rpc('get_site_stats', { site_uuid: siteId });
// Returns: source_count, articles_raw, articles_published, etc.
```

### Increment Article Views
```typescript
await supabase
  .rpc('increment_view_count', { article_uuid: articleId });
```

### Update Category Counts
```typescript
await supabase
  .rpc('update_category_counts', { site_uuid: siteId });
```

### Get User with Organization
```typescript
const { data: user } = await supabase
  .from('users')
  .select('*, organizations(*)')
  .eq('id', userId)
  .single();
```

### Get All Sites for User's Organization
```typescript
const { data: sites } = await supabase
  .from('sites')
  .select('*')
  // RLS handles organization filter automatically
  .order('created_at', { ascending: false });
```

### Get Published Articles with Author Info
```typescript
const { data: articles } = await supabase
  .from('articles')
  .select('*, sources(name), categories(name)')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(10);
```

### Search Articles
```typescript
const { data: articles } = await supabase
  .from('articles')
  .select('*')
  .ilike('title', `%${query}%`)
  .eq('site_id', siteId)
  .eq('status', 'published');
```

## Route Structure

```
/ (marketing)
├── /login (public)
├── /signup (public)
└── /auth/callback (public)

/dashboard (protected - requires auth)
├── /dashboard/sites
├── /dashboard/settings
└── /dashboard/...

/admin (protected - requires admin role)
├── /admin/users
├── /admin/alerts
└── /admin/...

/s/[slug] (public - display published site)

/api/
├── /api/auth/ (public)
├── /api/webhooks/ (public)
├── /api/public/ (public)
└── /api/... (protected per route)
```

## Deployment Checklist

- [ ] All migrations applied to production database
- [ ] Environment variables set in production
- [ ] Supabase project linked to custom domain
- [ ] Google OAuth configured (if using)
- [ ] Email domain verified in Resend
- [ ] Stripe API keys configured
- [ ] Custom domain DNS records set
- [ ] SSL certificate installed
- [ ] Rate limiting configured in Supabase
- [ ] CORS settings verified
- [ ] First admin user created
- [ ] Test signup/login flow works
- [ ] Test admin routes protected
- [ ] Monitor for RLS policy errors

## Debugging Tips

### Check Authentication Status
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.email);
console.log('User org:', user?.user_metadata?.organization_id);
```

### Check Session
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Expires at:', session?.expires_at);
```

### Monitor RLS Errors
Enable Row Level Security debug in Supabase dashboard:
1. Go to Logs
2. Filter by type: "API"
3. Look for "403 Forbidden" errors
4. Check policy conditions

### View Middleware Logs
```typescript
// In middleware.ts, add logging:
console.log('Protecting route:', pathname);
console.log('Auth status:', session ? 'authenticated' : 'anonymous');
```

### Test RLS in SQL Editor
```sql
-- Switch to anon role (simulates unauthenticated)
SET ROLE anon;

-- Try query that should fail
SELECT * FROM organizations;
-- Should return 0 rows

-- Switch back
SET ROLE authenticated;
```

## Performance Tips

1. **Index published articles**: Done (idx_articles_published)
2. **Cache user organization**: Use `getCurrentUser()` which caches
3. **Batch operations**: Use RPC functions for atomic updates
4. **Lazy load**: Use `select()` to specify columns
5. **Pagination**: Always limit results for large tables

```typescript
// ✅ Good - only select needed columns
const { data } = await supabase
  .from('articles')
  .select('id, title, published_at')  // Only needed columns
  .limit(50);

// ❌ Bad - selects everything
const { data } = await supabase
  .from('articles')
  .select('*')
  .limit(50);
```

## Security Reminders

1. ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser
2. ✅ Always check auth in Route Handlers before admin operations
3. ✅ Use RLS as primary security layer, not middleware alone
4. ✅ Validate all user input on server
5. ✅ Use prepared statements (Supabase client does this)
6. ✅ Rate limit auth endpoints (configure in Supabase)
7. ✅ Rotate API keys periodically
8. ✅ Monitor admin_alerts table for suspicious activity

---

**Last Updated**: February 14, 2026
**Maintainer**: Wave 1 Foundation Team
