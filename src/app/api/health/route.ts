// Health Check API — Test Supabase connection and environment
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // Check environment variables
  checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  };

  // Test Supabase connection
  try {
    const supabase = await createClient();
    
    // Try a simple query to test connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      checks.supabase = {
        status: 'error',
        message: error.message,
      };
    } else {
      checks.supabase = {
        status: 'connected',
        hasSession: !!data.session,
      };
    }

    // Test database access
    const { count, error: dbError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (dbError) {
      checks.database = {
        status: 'error',
        message: dbError.message,
        code: dbError.code,
      };
    } else {
      checks.database = {
        status: 'connected',
        usersCount: count,
      };
    }
  } catch (error) {
    checks.supabase = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return NextResponse.json(checks, { status: 200 });
}
