// Production House — Supabase Browser Client
// Used in client components and browser context
// =============================================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// #region agent log
function debugLog(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  if (typeof window !== 'undefined') {
    console.log(`[DEBUG ${hypothesisId}] ${location}: ${message}`, data);
  }
}
// #endregion

// Cache the client to prevent multiple instantiations
let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // #region agent log
  debugLog('client.ts:createClient:entry', 'createClient called', { hasCachedClient: !!cachedClient, cachedClientType: cachedClient ? typeof cachedClient : 'null' }, 'H4');
  // #endregion

  // Return cached client if available
  if (cachedClient) {
    // #region agent log
    debugLog('client.ts:createClient:cached', 'Returning cached client', { hasAuth: !!(cachedClient as any)?.auth, clientKeys: cachedClient ? Object.keys(cachedClient) : [] }, 'H4');
    // #endregion
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // #region agent log
  debugLog('client.ts:createClient:envCheck', 'Environment variables', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, urlPrefix: supabaseUrl?.substring(0, 20) }, 'H3');
  // #endregion

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      env: typeof window !== 'undefined' ? 'browser' : 'server',
    });
    throw new Error('Missing Supabase configuration. Please check environment variables.');
  }

  try {
    // #region agent log
    debugLog('client.ts:createClient:beforeCreate', 'About to call createBrowserClient', { createBrowserClientType: typeof createBrowserClient }, 'H2,H5');
    // #endregion

    // Use createBrowserClient from @supabase/ssr to store session in cookies
    // This is required for server-side auth checks in middleware
    cachedClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

    // #region agent log
    debugLog('client.ts:createClient:afterCreate', 'Client created', { 
      clientType: typeof cachedClient, 
      isNull: cachedClient === null, 
      isUndefined: cachedClient === undefined,
      hasAuth: !!(cachedClient as any)?.auth,
      clientKeys: cachedClient ? Object.keys(cachedClient) : []
    }, 'H2,H5');
    // #endregion

    return cachedClient;
  } catch (error) {
    // #region agent log
    debugLog('client.ts:createClient:error', 'Failed to create client', { error: String(error), errorType: typeof error }, 'H2,H5');
    // #endregion
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}
