// Admin API: Alerts
// GET: List all alerts
// PATCH: Resolve alerts

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Get resolved filter from query params
    const url = new URL(request.url);
    const resolved = url.searchParams.get('resolved');

    let query = adminSB.from('admin_alerts').select('*');

    // Filter by resolved status if specified
    if (resolved === 'true') {
      query = query.eq('is_resolved', true);
    } else if (resolved === 'false') {
      query = query.eq('is_resolved', false);
    }

    const alertsRes = await query.order('created_at', { ascending: false }).limit(100);

    if (!alertsRes.data) {
      return Response.json([]);
    }

    return Response.json(alertsRes.data);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();
    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Mark alerts as resolved
    const res = await adminSB
      .from('admin_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .in('id', alertIds);

    if (res.error) {
      return Response.json({ error: res.error.message }, { status: 400 });
    }

    return Response.json({ success: true, resolved: alertIds.length });
  } catch (error) {
    console.error('Failed to resolve alerts:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
