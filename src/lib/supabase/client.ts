// Production House — Supabase Browser Client
// Used in client components and browser context
// =============================================================
// NOTE: Using @supabase/supabase-js directly instead of @supabase/ssr
// due to React 19 / Next.js 16 / Turbopack compatibility issues (H5 confirmed)

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// #region agent log
function debugLog(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  if (typeof window !== 'undefined') {
    console.log(`[DEBUG ${hypothesisId}] ${location}: ${message}`, data);
  }
}
// #endregion

// Cache the client to prevent multiple instantiations
let cachedClient: SupabaseClient<Database> | null = null;

// Custom storage that uses cookies instead of localStorage
// This ensures auth state is available server-side
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        const decoded = decodeURIComponent(value);
        // #region agent log
        debugLog('cookieStorage:getItem', 'Retrieved cookie', { key, hasValue: !!decoded, valueLength: decoded?.length }, 'H6-fix');
        // #endregion
        return decoded;
      }
    }
    // #region agent log
    debugLog('cookieStorage:getItem', 'Cookie not found', { key }, 'H6-fix');
    // #endregion
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    // #region agent log
    debugLog('cookieStorage:setItem', 'Setting cookie', { key, valueLength: value?.length }, 'H6-fix');
    // #endregion
    // Set cookie with SameSite=Lax for security, max age 1 year
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    // #region agent log
    debugLog('cookieStorage:removeItem', 'Removing cookie', { key }, 'H6-fix');
    // #endregion
    document.cookie = `${key}=; path=/; max-age=0`;
  },
};

export function createClient() {
  // #region agent log
  debugLog('client.ts:createClient:entry', 'createClient called (supabase-js)', { hasCachedClient: !!cachedClient }, 'H6-fix');
  // #endregion

  // Return cached client if available
  if (cachedClient) {
    // #region agent log
    debugLog('client.ts:createClient:cached', 'Returning cached client', { hasAuth: !!(cachedClient as any)?.auth }, 'H6-fix');
    // #endregion
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // #region agent log
  debugLog('client.ts:createClient:envCheck', 'Environment variables', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey }, 'H6-fix');
  // #endregion

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase configuration. Please check environment variables.');
  }

  try {
    // #region agent log
    debugLog('client.ts:createClient:beforeCreate', 'Creating client with @supabase/supabase-js + cookie storage', {}, 'H6-fix');
    // #endregion

    // Use @supabase/supabase-js directly with custom cookie storage
    // This avoids the @supabase/ssr library's React 19 compatibility issues
    cachedClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: cookieStorage,
        storageKey: 'sb-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // #region agent log
    debugLog('client.ts:createClient:afterCreate', 'Client created successfully', { 
      hasAuth: !!(cachedClient as any)?.auth,
      clientKeys: cachedClient ? Object.keys(cachedClient) : []
    }, 'H6-fix');
    // #endregion

    return cachedClient;
  } catch (error) {
    // #region agent log
    debugLog('client.ts:createClient:error', 'Failed to create client', { error: String(error) }, 'H6-fix');
    // #endregion
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}
