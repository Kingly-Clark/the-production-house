# Stripe Billing System Implementation

## Overview
Complete Stripe integration for Production House - a multi-tenant SaaS content syndication platform. Implements quantity-based subscription billing at $49/site/month with full webhook support, subscription management, and customer portal integration.

## Business Model
- **Pricing**: $49 per site per month (flat rate)
- **Billing**: Quantity-based subscription (quantity = number of sites)
- **Organization Model**: One Stripe customer per organization
- **Proration**: Automatic proration on quantity changes (upgrades/downgrades)
- **Cancellation**: Support for immediate and period-end cancellation
- **Portal**: Customers can manage subscriptions via Stripe Customer Portal

## Architecture

### Core Files

#### Stripe Library (`src/lib/stripe/`)

**1. `client.ts` - Stripe Client Initialization**
- Initializes Stripe SDK with secret key
- Exports singleton Stripe instance
- Exports `STRIPE_PRICE_ID` constant for consistency
- Environment variables:
  - `STRIPE_SECRET_KEY` (required)
  - `STRIPE_PRICE_ID` (required)

**2. `checkout.ts` - Checkout Session Management**
- `createCheckoutSession()` - Creates Stripe checkout session
  - Gets or creates Stripe customer for organization
  - Sets up subscription with specified quantity
  - Supports coupon codes
  - Returns checkout URL for redirect
- Handles customer creation and updates Supabase with `stripe_customer_id`

**3. `subscriptions.ts` - Subscription Management**
- `getSubscription()` - Retrieves current subscription
- `updateQuantity()` - Updates quantity with proration
- `cancelSubscription()` - Cancels at period end or immediately
- `resumeSubscription()` - Reactivates cancelled subscription
- `createCustomerPortalSession()` - Creates portal URL for customer self-service
- All functions sync between Stripe and Supabase

**4. `webhooks.ts` - Webhook Event Handlers**
- `verifyWebhookSignature()` - Validates webhook authenticity
- Handles 5 critical events:
  - `checkout.session.completed` - Creates org/subscription on signup
  - `customer.subscription.updated` - Syncs quantity/status changes
  - `customer.subscription.deleted` - Marks subscription as cancelled
  - `invoice.payment_succeeded` - Sets org plan_status to 'active'
  - `invoice.payment_failed` - Sets to 'past_due' and creates admin alert
- All handlers update both Stripe and Supabase for consistency

### API Routes (`src/app/api/`)

**1. `billing/checkout/route.ts` - POST: Create Checkout Session**
```typescript
POST /api/billing/checkout
Body: { quantity: number, coupon?: string }
Response: { url: string }
```
- Requires authentication
- Creates checkout session with specified quantity
- Redirects to Stripe checkout
- Includes optional coupon code support

**2. `billing/portal/route.ts` - POST: Create Portal Session**
```typescript
POST /api/billing/portal
Response: { url: string }
```
- Requires authentication
- Creates Stripe Customer Portal session
- Allows customer to manage subscription, view invoices, etc.

**3. `billing/info/route.ts` - GET: Fetch Billing Information**
```typescript
GET /api/billing/info
Response: {
  organization: Organization,
  subscription: Subscription | null,
  sites: Site[]
}
```
- Requires authentication
- Returns current org, subscription, and sites list
- Used to populate billing dashboard

**4. `billing/add-site/route.ts` - POST: Add New Site**
```typescript
POST /api/billing/add-site
Body: { siteName: string, slug: string }
Response: Site (newly created)
```
- Requires authentication
- Creates new site if capacity available
- Auto-increments subscription if at capacity
- Creates default site_settings
- Validates slug format

**5. `billing/remove-site/route.ts` - POST: Remove Site**
```typescript
POST /api/billing/remove-site
Body: { siteId: string }
Response: { success: boolean }
```
- Requires authentication
- Soft-deletes site (marks as 'deleted')
- Decrements subscription quantity
- Updates org max_sites

**6. `stripe/webhooks/route.ts` - POST: Stripe Webhooks**
```typescript
POST /api/stripe/webhooks
Headers: stripe-signature (required)
Body: Raw text (not JSON - signature verification requirement)
```
- **CRITICAL**: Uses raw body for signature verification
- Verifies webhook authenticity with `STRIPE_WEBHOOK_SECRET`
- Routes to appropriate handler
- Returns 200 for all events (async processing)
- Logs unhandled events

### Dashboard Components (`src/components/dashboard/`)

**1. `BillingCard.tsx` - Plan Display**
- Shows current plan ($49/site/month)
- Displays number of active sites
- Shows monthly cost calculation
- Displays next billing date
- Shows cancellation warning if applicable
- Beautiful dark-theme styling with status badge

**2. `AddSiteDialog.tsx` - Site Creation Dialog**
- Modal dialog for creating new sites
- Auto-generates slug from site name
- Real-time slug validation
- Error message display
- Loading state during creation
- Closes on successful submission

### Dashboard Page (`src/app/(dashboard)/dashboard/billing/page.tsx`)

Complete billing dashboard with:
- Current plan card with subscription status
- Site capacity usage bar (with color indicators)
- Add/manage subscription buttons
- Site list with manage/delete buttons
- Success/error message handling
- Query parameter handling (`?success=true`, `?cancelled=true`)
- Responsive grid layout
- Dark mode support

## Database Schema Integration

### Updated Tables

**organizations**
- `stripe_customer_id` - Stripe Customer ID
- `plan_status` - Subscription status (active, past_due, cancelled, paused)
- `max_sites` - Maximum sites allowed (quantity)

**subscriptions** (new/existing)
- `organization_id` - FK to organizations
- `stripe_subscription_id` - Stripe Subscription ID
- `stripe_price_id` - Stripe Price ID
- `status` - Subscription status
- `quantity` - Number of sites
- `current_period_start` - Billing period start
- `current_period_end` - Billing period end
- `cancel_at_period_end` - Cancellation flag
- `created_at`, `updated_at`

**sites**
- `status` - Soft delete uses 'deleted' status (not deleted from DB)

**admin_alerts** (for payment failures)
- Type: `payment_failed`
- Severity: `critical`
- Includes organization_id for filtering

## Environment Variables

Add to `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Create Stripe Price
1. Go to Stripe Dashboard → Billing → Products
2. Create product: "Production House - Site License"
3. Create price: $49/month recurring
4. Copy price ID (format: `price_...`)
5. Add to `.env.local` as `STRIPE_PRICE_ID`

### 2. Configure Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create webhook for your app URL: `https://yourdomain.com/api/stripe/webhooks`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret
5. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 3. Test Webhook Locally (Optional)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
# Copy signing secret and add to .env.local
```

## Security Considerations

### Webhook Verification
- Uses HMAC SHA256 signature verification
- **CRITICAL**: Endpoint uses raw body (`request.text()`) not parsed JSON
- Signature verified before processing
- Invalid signatures rejected with 401

### API Route Security
- All routes require authentication via `getCurrentUser()`
- Organization context enforced (users can only access their org)
- Input validation on all user-provided data
- Error messages don't leak sensitive information

### Sensitive Data
- Stripe keys never exposed to client
- Customer Portal used for billing management (not custom UI)
- Webhook secret stored in environment only
- Subscription sensitive data handled server-side only

## Error Handling

### Checkout Errors
- Invalid quantity rejected (must be > 0)
- Missing/invalid coupon codes rejected
- Stripe API errors logged and returned as 500

### Subscription Errors
- Quantity can't go below 1
- Nonexistent subscriptions handled gracefully
- Proration failures logged but don't block operation

### Webhook Errors
- Signature verification failures return 401
- Missing event data logged as warnings
- Events still return 200 (acknowledged) for replay safety
- Database sync failures logged but don't fail endpoint

## Testing

### Local Testing Flow
```bash
# Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Create test checkout (in browser console)
fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 1 })
})
.then(r => r.json())
.then(d => window.location.href = d.url)

# Complete checkout with test card: 4242 4242 4242 4242

# Webhook events will be delivered to your local server
```

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

## Deployment Checklist

- [ ] Add Stripe keys to production environment variables
- [ ] Configure webhook in Stripe Dashboard for production domain
- [ ] Test webhook delivery in Stripe Dashboard
- [ ] Monitor webhook event logs for failures
- [ ] Set up admin alerts for payment_failed events
- [ ] Verify subscription creation in production environment
- [ ] Test customer portal access
- [ ] Set up monitoring for 500 errors on billing endpoints
- [ ] Create runbook for handling failed payments
- [ ] Document billing escalation process

## Monitoring & Maintenance

### Key Metrics to Monitor
- Webhook delivery success rate
- Subscription creation rate
- Checkout session completion rate
- Payment failure rate
- Site capacity utilization

### Admin Alerts
Payment failures automatically create admin alerts with:
- Organization ID
- Invoice ID
- Amount and currency
- Severity: critical
- Manual resolution required

### Database Consistency
All Stripe operations update both Stripe and Supabase to maintain consistency:
- Quantity changes sync immediately
- Status changes tracked in both systems
- Period dates stored for reference

## Future Enhancements

1. **Free Trial**: Add trial period in checkout
   - Stripe supports `trial_period_days` parameter
   - Update subscription model to track trial status

2. **Usage-Based Billing**: Add metered usage
   - Track actual articles published
   - Bill based on usage + quantity

3. **Custom Invoicing**: Add invoice customization
   - Invoice prefix, tax ID, custom fields
   - Send custom invoice emails

4. **Dunning Management**: Automated payment retry
   - Configure retry schedules in Stripe
   - Escalation emails for failed payments

5. **Multi-Currency**: Support multiple currencies
   - Add currency selector to checkout
   - Convert prices dynamically

6. **Tax Compliance**: Add tax calculation
   - Stripe Tax integration
   - Automatic tax calculation per region

## File Locations Summary

```
src/
├── lib/stripe/
│   ├── client.ts                 # Stripe SDK init
│   ├── checkout.ts               # Checkout logic
│   ├── subscriptions.ts          # Subscription mgmt
│   └── webhooks.ts               # Webhook handlers
├── app/api/
│   ├── billing/
│   │   ├── checkout/route.ts     # POST checkout
│   │   ├── portal/route.ts       # POST portal
│   │   ├── info/route.ts         # GET info
│   │   ├── add-site/route.ts     # POST add site
│   │   └── remove-site/route.ts  # POST remove site
│   └── stripe/
│       └── webhooks/route.ts     # POST webhooks
├── components/dashboard/
│   ├── BillingCard.tsx           # Plan display
│   └── AddSiteDialog.tsx         # Site creation
└── app/(dashboard)/dashboard/
    └── billing/
        └── page.tsx              # Billing dashboard
```

## Support & Troubleshooting

### Webhook Not Receiving Events
1. Check webhook URL is accessible from internet
2. Verify signing secret is correct
3. Check Stripe Dashboard → Developers → Webhooks → Event Logs
4. Ensure route handler doesn't error on valid signatures

### Subscription Not Creating
1. Verify `STRIPE_PRICE_ID` is correct and active
2. Check Stripe customer created in Dashboard
3. Review database logs for sync errors
4. Check organization has no existing subscription

### Quantity Update Failing
1. Verify subscription exists in both Stripe and DB
2. Check new quantity >= 1
3. Verify no active proration in progress
4. Check Stripe balance for prorations (in USD)

## Code Quality

- ✅ Full TypeScript (no `any` types)
- ✅ Comprehensive error handling
- ✅ Input validation on all routes
- ✅ Security: signature verification, auth checks
- ✅ Database consistency: dual updates
- ✅ Async operations: proper error handling
- ✅ Logging: meaningful error messages
- ✅ Comments: clear documentation

## References

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Pricing](https://stripe.com/docs/payments/payment-intents)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions)
- [Stripe Customer Portal](https://stripe.com/docs/billing/customer-portal)
