// Admin API: Bulk Delete Articles
// POST: Delete multiple articles

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

// Force dynamic rendering - this route uses runtime env vars
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Delete articles
    const res = await adminSB.from('articles').delete().in('id', ids);

    if (res.error) {
      return Response.json({ error: res.error.message }, { status: 400 });
    }

    return Response.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Failed to delete articles:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
