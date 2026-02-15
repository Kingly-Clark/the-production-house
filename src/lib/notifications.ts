import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationType } from '@/types/database';

/**
 * Create a notification for a user.
 * Fails silently — notifications should never block the main operation.
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }
) {
  try {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      is_read: false,
      link: params.link || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Find the owner user ID for a site (via organization).
 */
export async function getSiteOwnerUserId(
  supabase: SupabaseClient,
  siteId: string
): Promise<string | null> {
  try {
    const { data: site } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (!site) return null;

    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', site.organization_id)
      .limit(1);

    return users && users.length > 0 ? users[0].id : null;
  } catch {
    return null;
  }
}
