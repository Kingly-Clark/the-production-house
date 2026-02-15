// Production House — Supabase Server Client
// Used in Server Components, Route Handlers, and server functions
// =============================================================
// NOTE: Using @supabase/supabase-js directly to match client-side (H6 fix)

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

  // Get session from our custom cookie
  const sessionData = getSessionFromCookie(cookieStore);
  
  // #region agent log
  console.log('[DEBUG H6-fix] server.ts:createClient', { 
    hasSessionData: !!sessionData,
    hasAccessToken: !!sessionData?.access_token,
    hasRefreshToken: !!sessionData?.refresh_token,
  });
  // #endregion

  // Create client
  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // If we have session data, set it in the client so getSession() works
  if (sessionData) {
    // #region agent log
    console.log('[DEBUG H6-fix] server.ts:setSession - attempting to set session');
    // #endregion
    
    const { error } = await client.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });
    
    // #region agent log
    console.log('[DEBUG H6-fix] server.ts:setSession - result', { 
      success: !error,
      error: error?.message 
    });
    // #endregion
  }

  return client;
}
