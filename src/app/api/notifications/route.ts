import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/database';

// GET: List recent notifications for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user record to find their user ID
    const { data: user } = await adminClient
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ notifications: [], unread_count: 0 });
    }

    // Get recent notifications (last 50)
    // Note: The notifications table must be created in Supabase first
    const { data: notifications, error } = await adminClient
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // Cast to Notification type since table isn't in generated types yet
    const typedNotifications = (notifications || []) as unknown as Notification[];
    const unreadCount = typedNotifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: typedNotifications,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    // Use type assertion since notifications table isn't in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationsTable = adminClient.from('notifications') as any;

    if (markAll) {
      // Mark all as read for this user
      await notificationsTable
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await notificationsTable
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('user_id', session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
