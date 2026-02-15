// Production House — Supabase Browser Client
// Used in client components and browser context
// =============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Cache the client to prevent multiple instantiations
let cachedClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

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
    cachedClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}
