// Production House — Supabase Server Client
// Used in Server Components, Route Handlers, and server functions
// =============================================================
// NOTE: Using @supabase/supabase-js directly to match client-side (H6 fix)

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Helper to parse auth token from our custom cookie
function getSessionFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): { access_token: string; refresh_token: string } | null {
  const authCookie = cookieStore.get('sb-auth-token');
  if (!authCookie?.value) return null;
  
  try {
    const decoded = decodeURIComponent(authCookie.value);
    const parsed = JSON.parse(decoded);
    if (parsed.access_token && parsed.refresh_token) {
      return parsed;
    }
  } catch {
    // Cookie might be malformed
  }
  return null;
}

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get session from our custom cookie
  const sessionData = getSessionFromCookie(cookieStore);

  // Create client with auth header if we have a session
  const options = sessionData
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${sessionData.access_token}`,
          },
        },
      }
    : {};

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, options);
}
