// Production House — Supabase Server Client
// Used in Server Components, Route Handlers, and server functions
// =============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get auth tokens from cookies
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // Try to get auth from the Supabase auth cookie format
  const allCookies = cookieStore.getAll();
  let authCookie: { access_token?: string; refresh_token?: string } | null = null;
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        // The cookie value might be base64 encoded JSON
        const decoded = Buffer.from(cookie.value.split('.')[0] || cookie.value, 'base64').toString();
        authCookie = JSON.parse(decoded);
      } catch {
        try {
          authCookie = JSON.parse(cookie.value);
        } catch {
          // Not a JSON cookie
        }
      }
      break;
    }
  }

  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken || authCookie?.access_token
        ? { Authorization: `Bearer ${accessToken || authCookie?.access_token}` }
        : undefined,
    },
  });

  // If we have tokens, set the session
  if (authCookie?.access_token && authCookie?.refresh_token) {
    await client.auth.setSession({
      access_token: authCookie.access_token,
      refresh_token: authCookie.refresh_token,
    });
  } else if (accessToken && refreshToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}
