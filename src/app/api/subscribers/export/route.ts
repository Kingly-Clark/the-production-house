import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('site_id', siteId)
      .order('subscribed_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Create CSV
    const headers = ['Email', 'Status', 'Subscribed', 'Confirmed'];
    const rows = (subscribers || []).map((sub) => [
      `"${sub.email.replace(/"/g, '""')}"`,
      sub.is_confirmed ? 'Confirmed' : 'Pending',
      new Date(sub.subscribed_at).toISOString().split('T')[0],
      sub.confirmed_at
        ? new Date(sub.confirmed_at).toISOString().split('T')[0]
        : '',
    ]);

    const csv =
      [headers, ...rows].map((row) => row.join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscribers-${siteId}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error exporting subscribers:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
