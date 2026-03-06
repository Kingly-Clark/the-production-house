// ContentMill — Admin Voucher Management API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);
    const admin = createAdminClient();

    const [vouchersRes, redemptionsRes] = await Promise.all([
      admin.from('voucher_codes').select('*').order('created_at', { ascending: false }),
      admin.from('voucher_redemptions').select('*').order('redeemed_at', { ascending: false }),
    ]);

    return NextResponse.json({
      vouchers: vouchersRes.data || [],
      redemptions: redemptionsRes.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);
    const admin = createAdminClient();

    const body = await request.json();
    const { code, description, max_sites, max_uses } = body;

    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const { data, error } = await admin
      .from('voucher_codes')
      .insert({
        code: code.toUpperCase().trim(),
        description: description || null,
        plan_status: 'founder',
        max_sites: max_sites || 5,
        max_uses: max_uses || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A voucher with this code already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);
    const admin = createAdminClient();

    const body = await request.json();
    const { id, is_active } = body;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await admin
      .from('voucher_codes')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
