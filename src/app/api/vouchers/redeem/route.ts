// ContentMill — Voucher Code Redemption
// Called after auth to apply a voucher to the user's organisation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const code = (body.code as string)?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Validate the voucher
    const { data: voucher, error: voucherError } = await admin
      .from('voucher_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Invalid or inactive voucher code' }, { status: 400 });
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This voucher code has expired' }, { status: 400 });
    }

    if (voucher.max_uses !== null && voucher.uses_count >= voucher.max_uses) {
      return NextResponse.json({ error: 'This voucher code has reached its usage limit' }, { status: 400 });
    }

    // Get or create the user's organisation
    let { data: dbUser } = await admin
      .from('users')
      .select('id, organization_id, full_name, email')
      .eq('id', authUser.id)
      .single();

    // Upsert user record if missing
    if (!dbUser) {
      const { data: newUser } = await admin
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || '',
          role: 'client',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      dbUser = newUser;
    }

    let organizationId = dbUser?.organization_id;

    if (!organizationId) {
      // Create a new organisation for this user
      const orgName = dbUser?.full_name || authUser.email?.split('@')[0] || 'My Organisation';

      const { data: newOrg, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: orgName,
          plan_status: voucher.plan_status,
          max_sites: voucher.max_sites,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orgError || !newOrg) {
        throw new Error(`Failed to create organisation: ${orgError?.message}`);
      }

      organizationId = newOrg.id;

      // Link user to org
      await admin
        .from('users')
        .update({ organization_id: organizationId, updated_at: new Date().toISOString() })
        .eq('id', authUser.id);

      // Create a founder subscription record (no Stripe ID needed)
      await admin.from('subscriptions').insert({
        organization_id: organizationId,
        status: 'active',
        quantity: 0,
        stripe_subscription_id: null,
        stripe_price_id: null,
        cancel_at_period_end: false,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Update existing organisation to founder status
      await admin
        .from('organizations')
        .update({
          plan_status: voucher.plan_status,
          max_sites: voucher.max_sites,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    // Check not already redeemed by this org
    const { data: existingRedemption } = await admin
      .from('voucher_redemptions')
      .select('id')
      .eq('voucher_code_id', voucher.id)
      .eq('organization_id', organizationId)
      .single();

    if (!existingRedemption) {
      // Record redemption
      await admin.from('voucher_redemptions').insert({
        voucher_code_id: voucher.id,
        organization_id: organizationId,
        user_id: authUser.id,
        redeemed_at: new Date().toISOString(),
      });

      // Increment usage count
      await admin
        .from('voucher_codes')
        .update({ uses_count: voucher.uses_count + 1, updated_at: new Date().toISOString() })
        .eq('id', voucher.id);
    }

    return NextResponse.json({ success: true, plan_status: voucher.plan_status, max_sites: voucher.max_sites });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Voucher redemption error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
