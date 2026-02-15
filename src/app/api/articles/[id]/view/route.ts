import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = createAdminClient();

    // Simple bot detection via user-agent
    const ua = request.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|facebook|twitter|linkedin|whatsapp|telegram|preview/i.test(ua);
    if (isBot) {
      return NextResponse.json({ success: true, counted: false });
    }

    // Increment view count
    await adminClient.rpc('increment_view_count', { article_uuid: id });

    return NextResponse.json({ success: true, counted: true });
  } catch (error) {
    console.error('Error incrementing view:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
