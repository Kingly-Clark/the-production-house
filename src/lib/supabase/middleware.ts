// Production House — Supabase Middleware Helper
// Refreshes auth token on every request
// =============================================================

import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import type { NextRequest, NextResponse } from 'next/server';

export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session - this will update the auth tokens
  // in cookies if needed
  await supabase.auth.getSession();

  return response;
}
