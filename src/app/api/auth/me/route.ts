import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user from users table using admin client
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      // User authenticated but not in users table - return basic info from session
      return NextResponse.json({
        id: session.user.id,
        email: session.user.email,
        role: 'client',
        organization_id: null,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
