// Production House — Supabase Browser Client
// Used in client components and browser context
// =============================================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Cache the client to prevent multiple instantiations
let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      env: typeof window !== 'undefined' ? 'browser' : 'server',
    });
    throw new Error('Missing Supabase configuration. Please check environment variables.');
  }

  try {
    // Use createBrowserClient from @supabase/ssr to store session in cookies
    // This is required for server-side auth checks in middleware
    cachedClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
    return cachedClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}
