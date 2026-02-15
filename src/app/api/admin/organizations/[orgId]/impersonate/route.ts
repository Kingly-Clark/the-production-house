// Admin API: Impersonate Organization
// POST: Set impersonation cookie to view as organization

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';
import { cookies } from 'next/headers';

// Force dynamic rendering - this route uses runtime env vars
export const dynamic = 'force-dynamic';

interface RequestParams {
  params: Promise<{ orgId: string }>;
}

export async function POST(_request: Request, { params }: RequestParams) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Verify organization exists
    const orgRes = await adminSB
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single();

    if (orgRes.error) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Set impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set('x-impersonate-org', orgId, {
      maxAge: 60 * 60, // 1 hour
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return Response.json({ success: true, orgId });
  } catch (error) {
    console.error('Failed to set impersonation:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
