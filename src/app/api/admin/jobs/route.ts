// Admin API: Job Logs
// GET: List recent job executions

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/helpers';

// Force dynamic rendering - this route uses runtime env vars
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const adminSB = createAdminClient();

    // Get limit from query params
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch recent job logs
    const jobsRes = await adminSB
      .from('job_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (!jobsRes.data) {
      return Response.json([]);
    }

    return Response.json(jobsRes.data);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
