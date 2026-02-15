// Production House — Supabase Server Client
// Used in Server Components, Route Handlers, and server functions
// =============================================================

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Helper to parse auth token from our custom cookie
function getSessionFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): { access_token: string; refresh_token: string; expires_at?: number } | null {
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

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const sessionData = getSessionFromCookie(cookieStore);

  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // If we have session data, set it in the client so getSession() works
  if (sessionData) {
    await client.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });
  }

  return client;
}
