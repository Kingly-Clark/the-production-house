# Domain Management — Quick Start Guide

## Files Created

All files are production-ready and fully implemented. No placeholders.

```
src/lib/domains/
  ├── index.ts (310 lines)          ✓ Core domain operations
  └── vercel.ts (191 lines)         ✓ Vercel API integration

src/app/api/domains/
  ├── route.ts (154 lines)          ✓ GET list, POST create
  ├── [id]/route.ts (125 lines)     ✓ GET detail, DELETE
  └── [id]/verify/route.ts (92 lines) ✓ POST manual verification

supabase/functions/
  └── check-domains/index.ts (326 lines) ✓ Automated verification (Deno)

Documentation/
  ├── DOMAIN_MANAGEMENT.md          ✓ Complete documentation
  ├── IMPLEMENTATION_SUMMARY.md     ✓ Technical summary
  └── QUICK_START_DOMAINS.md        ✓ This file
```

## Setup Checklist

### 1. Environment Variables
Add to `.env.local`:
```bash
VERCEL_API_TOKEN=your_token_here
VERCEL_PROJECT_ID=your_project_id
VERCEL_TEAM_ID=optional_team_id
```

Get these from:
- Token: https://vercel.com/account/tokens
- Project ID: Vercel project settings
- Team ID: Optional, for team projects

### 2. Database (Already Done)
The `site_domains` table already exists with all needed fields.

Check with:
```sql
SELECT * FROM site_domains LIMIT 1;
```

### 3. Deploy Edge Function (Optional)
The edge function runs every 5 minutes via cron.

To deploy:
```bash
supabase functions deploy check-domains
```

To test locally:
```bash
supabase functions serve check-domains
```

### 4. Test API Endpoints

**Add a domain:**
```bash
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "your_site_id",
    "domain": "example.com",
    "domainType": "custom"
  }'
```

**List domains:**
```bash
curl http://localhost:3000/api/domains?siteId=your_site_id
```

**Check verification:**
```bash
curl -X POST http://localhost:3000/api/domains/domain_id/verify
```

**Delete domain:**
```bash
curl -X DELETE http://localhost:3000/api/domains/domain_id
```

## API Reference

### GET /api/domains?siteId=<id>
List all domains for a site.

### POST /api/domains
Add custom domain.
```json
{
  "siteId": "site_123",
  "domain": "example.com",
  "domainType": "custom"
}
```

### GET /api/domains/<id>
Get domain details.

### DELETE /api/domains/<id>
Remove domain.

### POST /api/domains/<id>/verify
Manually check verification status.

## Core Functions

### From `src/lib/domains/index.ts`

```typescript
import {
  addCustomDomain,
  verifyDomain,
  removeDomain,
  getDomainStatus,
  checkDNS,
  activateDomain,
  failDomain,
  getDomainsForChecking,
} from '@/lib/domains';

// Add domain
const domain = await addCustomDomain('site_id', 'example.com', 'custom');

// Check if verified
const verified = await verifyDomain('domain_id');

// Get status
const status = await getDomainStatus('domain_id');

// Remove domain
await removeDomain('domain_id');
```

### From `src/lib/domains/vercel.ts`

```typescript
import {
  addDomainToVercel,
  removeDomainFromVercel,
  getVercelVerificationRecords,
  isDomainVerifiedOnVercel,
} from '@/lib/domains/vercel';

// Get DNS records to show user
const records = await getVercelVerificationRecords('example.com');

// Check if verified on Vercel
const verified = await isDomainVerifiedOnVercel('example.com');
```

## Verification Flow Summary

```
1. User adds domain
   POST /api/domains { siteId, domain, domainType }

2. System creates CNAME record
   _verify.example.com → verify.productionhouse.ai
   Status: pending

3. User adds CNAME at DNS provider
   (Takes 24-48 hours to propagate)

4. Edge function checks every 5 minutes
   pending → verifying → verified → active

5. Domain goes live
   Traffic served via custom domain with SSL
```

## Status Values

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `pending` | Created, waiting for DNS | Add CNAME to DNS provider |
| `verifying` | DNS check scheduled | Wait for propagation |
| `verified` | CNAME found, SSL provisioning | Wait for SSL |
| `active` | Ready to serve | Domain is live |
| `failed` | Verification failed | Delete and retry |

## Common Tasks

### Show User CNAME Instructions
```typescript
const response = await fetch(`/api/domains/${domainId}/verify`, {
  method: 'POST'
});
const { instructions } = await response.json();

// instructions contains:
// {
//   message: "To verify your domain...",
//   recordType: "CNAME",
//   recordName: "_verify.example.com",
//   recordValue: "verify.productionhouse.ai",
//   notes: [...]
// }
```

### Check All Domains for a Site
```typescript
const response = await fetch(`/api/domains?siteId=${siteId}`);
const domains = await response.json();

// Filter by status
const active = domains.filter(d => d.verification_status === 'active');
const pending = domains.filter(d => d.verification_status === 'pending');
```

### Manually Verify a Domain
```typescript
const response = await fetch(`/api/domains/${domainId}/verify`, {
  method: 'POST'
});
const result = await response.json();

if (result.verificationResult.verified) {
  console.log('Domain verified! SSL provisioning...');
}
```

## Monitoring

### Check Domain Status
```sql
-- All domains by status
SELECT verification_status, COUNT(*) as count
FROM site_domains
GROUP BY verification_status;

-- Pending domains (older than 1 hour)
SELECT * FROM site_domains
WHERE verification_status IN ('pending', 'verifying')
AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;

-- Failed domains
SELECT * FROM site_domains
WHERE verification_status = 'failed'
ORDER BY updated_at DESC;
```

### Check Edge Function Logs
```sql
-- Recent job runs
SELECT * FROM job_log
WHERE job_type = 'check_domains'
ORDER BY started_at DESC
LIMIT 20;

-- Failed runs
SELECT * FROM job_log
WHERE job_type = 'check_domains'
AND status = 'failed'
ORDER BY started_at DESC;

-- Check alerts
SELECT * FROM admin_alerts
WHERE type = 'domain_issue'
ORDER BY created_at DESC;
```

## Troubleshooting

### Domain stuck in "pending"
1. Verify CNAME at DNS provider: `dig _verify.example.com CNAME`
2. Check if record propagated: `nslookup _verify.example.com`
3. Wait 24-48 hours for full propagation
4. Try manual verification: `POST /api/domains/{id}/verify`

### "Domain already in use"
- This domain is already added by another site
- Use different domain or delete the existing one first

### Vercel API errors
- Check `VERCEL_API_TOKEN` is valid
- Verify `VERCEL_PROJECT_ID` is correct
- Check admin_alerts table for details

### SSL not provisioning
- Domain must be verified first (DNS CNAME found)
- Let's Encrypt needs to validate ownership
- May take up to 24 hours
- Check `ssl_status` field for specific errors

## Code Examples

### React Component
```typescript
'use client';
import { useState } from 'react';

export function AddDomain({ siteId }: { siteId: string }) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, domain }),
      });
      if (!res.ok) throw new Error(await res.text());
      const newDomain = await res.json();
      // Show verification instructions
      alert(`Add CNAME: _verify.${domain} → verify.productionhouse.ai`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="example.com"
      />
      <button onClick={handleAdd} disabled={loading}>
        {loading ? 'Adding...' : 'Add Domain'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## Security Notes

- All endpoints require authentication
- Organization-level access control
- Domain ownership proven via DNS
- Vercel API token in env variables only
- Never expose tokens to frontend

## Performance Notes

- DNS checks are non-blocking
- Database queries optimized
- Edge function runs every 5 minutes
- Error handling won't crash system
- Admin alerts for monitoring

## Next Steps

1. Add Vercel credentials to `.env.local`
2. Deploy edge function: `supabase functions deploy check-domains`
3. Test endpoints with curl or Postman
4. Build UI components to call APIs
5. Monitor domain status in admin dashboard

## Documentation

For detailed information, see:
- `DOMAIN_MANAGEMENT.md` - Complete system documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- Source code comments for function details

## Support

All code is fully commented and documented. Check:
1. Inline code comments for implementation details
2. Function JSDoc comments for usage
3. DOMAIN_MANAGEMENT.md for workflows
4. IMPLEMENTATION_SUMMARY.md for architecture
