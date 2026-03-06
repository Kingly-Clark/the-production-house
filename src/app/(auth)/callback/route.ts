// ContentMill — OAuth & Email Verification Callback
// Exchanges auth code for session, applies voucher if present, then redirects
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Auto-apply voucher code from user metadata if present
      const voucherCode = data.user.user_metadata?.voucher_code as string | undefined;

      if (voucherCode) {
        try {
          // Call the redeem endpoint internally using admin client
          const admin = createAdminClient();

          const { data: voucher } = await admin
            .from('voucher_codes')
            .select('*')
            .eq('code', voucherCode.toUpperCase().trim())
            .eq('is_active', true)
            .single();

          if (voucher) {
            const now = new Date().toISOString();

            // Get or upsert user record
            const { data: dbUser } = await admin
              .from('users')
              .upsert({
                id: data.user.id,
                email: data.user.email || '',
                full_name: data.user.user_metadata?.full_name || '',
                role: 'client',
                updated_at: now,
              })
              .select('id, organization_id')
              .single();

            let organizationId = dbUser?.organization_id;

            if (!organizationId) {
              // Create organisation with founder plan
              const orgName = data.user.user_metadata?.full_name ||
                data.user.email?.split('@')[0] || 'My Organisation';

              const { data: newOrg } = await admin
                .from('organizations')
                .insert({
                  name: orgName,
                  plan_status: voucher.plan_status,
                  max_sites: voucher.max_sites,
                  created_at: now,
                  updated_at: now,
                })
                .select()
                .single();

              if (newOrg) {
                organizationId = newOrg.id;

                // Link user to org
                await admin
                  .from('users')
                  .update({ organization_id: organizationId, updated_at: now })
                  .eq('id', data.user.id);

                // Create subscription record
                await admin.from('subscriptions').insert({
                  organization_id: organizationId,
                  status: 'active',
                  quantity: 0,
                  stripe_subscription_id: null,
                  stripe_customer_id: null,
                  cancel_at_period_end: false,
                  current_period_start: now,
                  current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  created_at: now,
                  updated_at: now,
                });

                // Record redemption + increment uses
                const { data: existing } = await admin
                  .from('voucher_redemptions')
                  .select('id')
                  .eq('voucher_code_id', voucher.id)
                  .eq('organization_id', organizationId)
                  .single();

                if (!existing) {
                  await admin.from('voucher_redemptions').insert({
                    voucher_code_id: voucher.id,
                    organization_id: organizationId,
                    user_id: data.user.id,
                    redeemed_at: now,
                  });

                  await admin
                    .from('voucher_codes')
                    .update({ uses_count: voucher.uses_count + 1, updated_at: now })
                    .eq('id', voucher.id);
                }
              }
            }
          }
        } catch (voucherError) {
          // Never block the auth flow on voucher errors
          console.error('Voucher auto-redeem error:', voucherError);
        }
      }

      return NextResponse.redirect(new URL(redirect, request.url).toString());
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=Failed to authenticate', request.url).toString()
  );
}
