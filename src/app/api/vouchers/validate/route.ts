// ContentMill — Voucher Code Validation
// Public endpoint: checks if a code is valid without redeeming it

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: voucher } = await admin
    .from('voucher_codes')
    .select('id, code, description, plan_status, max_sites, max_uses, uses_count, is_active, expires_at')
    .eq('code', code)
    .single();

  if (!voucher || !voucher.is_active) {
    return NextResponse.json({ valid: false, error: 'Invalid or inactive voucher code' });
  }

  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'This voucher code has expired' });
  }

  if (voucher.max_uses !== null && voucher.uses_count >= voucher.max_uses) {
    return NextResponse.json({ valid: false, error: 'This voucher code has reached its usage limit' });
  }

  return NextResponse.json({
    valid: true,
    description: voucher.description,
    plan_status: voucher.plan_status,
    max_sites: voucher.max_sites,
  });
}
