// Production House — Supabase Admin Client
// Uses service role key to bypass RLS
// NEVER expose this client to the browser
// =============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export function createAdminClient() {
  return adminClient;
}
