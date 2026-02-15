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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip if environment variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    });

    // Refresh the session - this will update the auth tokens
    // in cookies if needed
    await supabase.auth.getSession();
  } catch (error) {
    console.error('Error refreshing session:', error);
  }

  return response;
}
