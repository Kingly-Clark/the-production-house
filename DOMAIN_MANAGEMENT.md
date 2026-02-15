# Production House — Domain Management System

Complete documentation for the multi-tenant custom domain management system.

## Architecture Overview

The domain management system supports three URL patterns for each site:

1. **Path-based (default)**: `productionhouse.ai/s/sports-fan-daily`
2. **Subdomain**: `sports-fan-daily.productionhouse.ai`
3. **Custom domain**: `sportsfandaily.com`

### Components

1. **Domain Library** (`src/lib/domains/index.ts`) — Core domain operations
2. **Vercel Integration** (`src/lib/domains/vercel.ts`) — Vercel API integration
3. **API Routes** (`src/app/api/domains/`) — REST API endpoints
4. **Edge Function** (`supabase/functions/check-domains/index.ts`) — Automated verification

## Setup Guide

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# Vercel Integration
VERCEL_API_TOKEN=your_vercel_api_token
VERCEL_PROJECT_ID=your_vercel_project_id
VERCEL_TEAM_ID=your_vercel_team_id (optional)
```

**How to get these:**

1. **VERCEL_API_TOKEN**: Create at https://vercel.com/account/tokens
   - Scope: Full access to your project
   - Keep this secret!

2. **VERCEL_PROJECT_ID**: Found in your project settings on Vercel
   - Go to Project Settings → General
   - Copy the Project ID

3. **VERCEL_TEAM_ID**: Optional, only if your project is in a team
   - Found in Team Settings on Vercel

### 2. Database Schema

The system uses the existing `site_domains` table with these fields:

```typescript
interface SiteDomain {
  id: string;
  site_id: string;
  domain: string; // e.g., "example.com"
  domain_type: 'custom' | 'subdomain';
  verification_status: 'pending' | 'verifying' | 'verified' | 'active' | 'failed';
  verification_record: string; // CNAME record format
  ssl_status: string; // 'pending', 'provisioning', 'active', 'failed: reason'
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}
```

## API Endpoints

### GET /api/domains?siteId=<id>

List all domains for a site.

**Parameters:**
- `siteId` (query, required): Site ID

**Response:**
```json
[
  {
    "id": "domain_123",
    "site_id": "site_456",
    "domain": "example.com",
    "domain_type": "custom",
    "verification_status": "pending",
    "verification_record": "_verify.example.com:verify.productionhouse.ai:token123",
    "ssl_status": "pending",
    "last_checked_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

### POST /api/domains

Add a new custom domain to a site.

**Request Body:**
```json
{
  "siteId": "site_456",
  "domain": "example.com",
  "domainType": "custom"
}
```

**Response:** (201 Created)
```json
{
  "id": "domain_123",
  "site_id": "site_456",
  "domain": "example.com",
  "domain_type": "custom",
  "verification_status": "pending",
  "verification_record": "_verify.example.com:verify.productionhouse.ai:token123",
  "ssl_status": "pending",
  "last_checked_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### GET /api/domains/[id]

Get details for a specific domain.

**Response:**
```json
{
  "id": "domain_123",
  "site_id": "site_456",
  "domain": "example.com",
  "domain_type": "custom",
  "verification_status": "pending",
  "verification_record": "_verify.example.com:verify.productionhouse.ai:token123",
  "ssl_status": "pending",
  "last_checked_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### DELETE /api/domains/[id]

Remove a domain from a site. This will:
- Remove from Supabase database
- Remove from Vercel project
- Stop serving traffic to the domain

**Response:**
```json
{
  "success": true
}
```

### POST /api/domains/[id]/verify

Manually trigger verification check for a domain. Returns current status and instructions.

**Response:**
```json
{
  "domain": {
    "id": "domain_123",
    "site_id": "site_456",
    "domain": "example.com",
    "domain_type": "custom",
    "verification_status": "pending",
    "verification_record": "_verify.example.com:verify.productionhouse.ai:token123",
    "ssl_status": "pending",
    "last_checked_at": "2024-01-15T10:31:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "verificationResult": {
    "verified": false
  },
  "verificationRecords": [
    {
      "type": "CNAME",
      "domain": "_verify.example.com",
      "value": "verify.productionhouse.ai"
    }
  ],
  "misconfigured": false,
  "instructions": {
    "message": "To verify your domain, add the following CNAME record to your domain provider:",
    "recordType": "CNAME",
    "recordName": "_verify.example.com",
    "recordValue": "verify.productionhouse.ai",
    "notes": [
      "This may take 24-48 hours to propagate across the internet",
      "Once verified, SSL certificate provisioning will begin automatically",
      "You can check this page periodically to see verification progress"
    ]
  }
}
```

## Domain Verification Flow

### User's Workflow

1. **User adds domain** via dashboard
   ```
   POST /api/domains
   { siteId: "...", domain: "example.com" }
   ```

2. **System generates verification record**
   - Creates CNAME record: `_verify.example.com → verify.productionhouse.ai`
   - Domain status: `pending`
   - Added to Vercel project

3. **User adds CNAME to DNS provider**
   - Go to domain provider (GoDaddy, Namecheap, etc.)
   - Add DNS record:
     - Type: CNAME
     - Name: `_verify.example.com`
     - Value: `verify.productionhouse.ai`
   - Wait for propagation (24-48 hours typical)

4. **System verifies CNAME** (automatic, every 5 minutes)
   - Edge function checks DNS
   - When found: `pending → verifying → verified`
   - Begins SSL certificate provisioning

5. **SSL becomes active**
   - Let's Encrypt validates domain ownership via HTTP challenge
   - Certificate issued automatically
   - Domain status: `active`
   - Traffic now served over HTTPS

### Status Progression

```
pending → verifying → verified → active
  ↓         ↓           ↓         ↓
Added    DNS check  DNS valid   SSL ready
to site  in progress found      & active
```

### Failure Cases

- **Pending >48 hours**: Automatically marked as `failed`
- **DNS propagation issues**: Stays in `verifying` until resolved
- **Vercel API errors**: Logged as admin alert, manual retry possible
- **SSL provisioning fails**: Marked with reason in `ssl_status`

## Library Functions

### `addCustomDomain(siteId, domain, domainType?)`

Add a new custom domain to a site.

```typescript
import { addCustomDomain } from '@/lib/domains';

const domain = await addCustomDomain(
  'site_123',
  'example.com',
  'custom'
);
```

**Returns:** `SiteDomain` object with verification record

**Throws:** Error if domain format invalid or already in use

### `verifyDomain(domainId)`

Manually trigger DNS verification check.

```typescript
import { verifyDomain } from '@/lib/domains';

const result = await verifyDomain('domain_123');
// { verified: true } or { verified: false, error: "..." }
```

### `removeDomain(domainId)`

Delete a domain record.

```typescript
import { removeDomain } from '@/lib/domains';

await removeDomain('domain_123');
```

### `getDomainStatus(domainId)`

Get current domain information.

```typescript
import { getDomainStatus } from '@/lib/domains';

const domain = await getDomainStatus('domain_123');
```

### `checkDNS(domain, recordName, expectedValue)`

Check if DNS record exists (used internally).

```typescript
import { checkDNS } from '@/lib/domains';

const verified = await checkDNS(
  'example.com',
  '_verify.example.com',
  'verify.productionhouse.ai'
);
```

## Vercel Integration Functions

### `addDomainToVercel(domain)`

Add domain to Vercel project.

```typescript
import { addDomainToVercel } from '@/lib/domains/vercel';

const response = await addDomainToVercel('example.com');
```

### `removeDomainFromVercel(domain)`

Remove domain from Vercel project.

```typescript
import { removeDomainFromVercel } from '@/lib/domains/vercel';

await removeDomainFromVercel('example.com');
```

### `getVercelVerificationRecords(domain)`

Get DNS records needed for verification.

```typescript
import { getVercelVerificationRecords } from '@/lib/domains/vercel';

const records = await getVercelVerificationRecords('example.com');
// [{ type: 'CNAME', domain: '...', value: '...' }]
```

## Edge Function: check-domains

Runs automatically every 5 minutes via Supabase cron.

**Location:** `supabase/functions/check-domains/index.ts`

**What it does:**

1. Fetches all domains with status `pending` or `verifying`
2. For each domain:
   - Checks DNS CNAME record
   - Updates verification status
   - Checks SSL status
   - Logs results to `job_log` table
3. Marks domains failed if pending >48 hours
4. Creates admin alerts for issues

**Logs:**
- `job_log` table: Completion status, duration, errors
- Console: Detailed per-domain logs
- `admin_alerts` table: Critical issues

**Execution:**
- Every 5 minutes via pg_cron
- Deno TypeScript environment
- Service role access (no RLS)

## Frontend Integration Example

```typescript
// Fetch domains for a site
const response = await fetch('/api/domains?siteId=site_123');
const domains = await response.json();

// Add a new domain
const addResponse = await fetch('/api/domains', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'site_123',
    domain: 'example.com',
    domainType: 'custom',
  }),
});
const newDomain = await addResponse.json();

// Check verification status
const statusResponse = await fetch(`/api/domains/${newDomain.id}/verify`, {
  method: 'POST',
});
const status = await statusResponse.json();

// Show user instructions
console.log(status.instructions);
// {
//   message: "To verify your domain...",
//   recordType: "CNAME",
//   recordName: "_verify.example.com",
//   recordValue: "verify.productionhouse.ai",
//   notes: [...]
// }

// Delete a domain
await fetch(`/api/domains/${domainId}`, { method: 'DELETE' });
```

## Security Considerations

1. **Authorization**: All endpoints verify user's organization access
2. **Verification Required**: Domains must be verified before serving
3. **DNS Validation**: CNAME record confirms domain ownership
4. **SSL Auto-provisioning**: No manual certificate handling
5. **API Keys**: Vercel token never exposed to frontend
6. **Error Logging**: Failed operations logged for admins

## Troubleshooting

### Domain stuck in "pending" status

1. Verify CNAME record is correct at domain provider
2. Check DNS propagation: `dig _verify.example.com CNAME`
3. Wait 24-48 hours for global propagation
4. Try manual verification via `/api/domains/[id]/verify`

### Domain marked as "failed"

1. Check `ssl_status` field for specific reason
2. Delete and re-add the domain
3. Ensure domain is not in use elsewhere
4. Check admin alerts for system errors

### Vercel API errors

1. Verify `VERCEL_API_TOKEN` is valid and not expired
2. Check `VERCEL_PROJECT_ID` is correct
3. Verify Vercel project is active
4. Check Vercel API status page
5. Review `admin_alerts` table for details

### DNS check returns false

1. Wait for DNS propagation (24-48 hours)
2. Verify CNAME record at domain provider
3. Test with: `nslookup _verify.example.com`
4. Check for CNAME vs A record conflicts

## Monitoring

### Key Metrics

- Domains in each status (pending, verifying, verified, active, failed)
- Average verification time
- SSL provisioning success rate
- API error rate

### Alerts to Watch

- `admin_alerts` with type `domain_issue`
- `job_log` with failed status
- Domains stuck in `pending` >48 hours

### Query Examples

```sql
-- Domains by status
SELECT verification_status, COUNT(*)
FROM site_domains
GROUP BY verification_status;

-- Failed domains
SELECT * FROM site_domains
WHERE verification_status = 'failed'
ORDER BY updated_at DESC;

-- Domains pending verification
SELECT * FROM site_domains
WHERE verification_status IN ('pending', 'verifying')
ORDER BY created_at ASC;

-- Recent job logs
SELECT * FROM job_log
WHERE job_type = 'check_domains'
ORDER BY started_at DESC
LIMIT 50;
```

## Future Enhancements

1. **Wildcard domains**: Support `*.example.com` patterns
2. **DNS providers API**: Direct integration with GoDaddy, Route 53, etc.
3. **ACME challenges**: Custom ACME validation
4. **Domain analytics**: Track traffic by domain
5. **Auto-renewal alerts**: SSL certificate expiration warnings
6. **Batch operations**: Add/remove multiple domains at once
7. **Domain health dashboard**: Real-time status monitoring
