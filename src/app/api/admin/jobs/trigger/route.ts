// Admin API: Trigger Job
// POST: Manually trigger a background job

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/helpers';
import type { JobType } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const body = await request.json();
    const jobType: JobType = body.jobType;

    if (!jobType) {
      return Response.json({ error: 'Invalid job type' }, { status: 400 });
    }

    // In production, this would trigger the actual job
    // For now, we'll return success
    // You would implement actual job triggers via:
    // - Cloud Tasks
    // - Bull/BullMQ
    // - AWS SQS
    // - Firebase Cloud Tasks
    // - Cron service webhooks

    console.log(`Triggered job: ${jobType}`);

    return Response.json({
      success: true,
      jobType,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to trigger job:', error);
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
