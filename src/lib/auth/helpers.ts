// Production House — Authentication Helpers
// Utility functions for common auth operations
// =============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, User, Organization } from '@/types/database';

/**
 * Get the currently authenticated user with their organization info
 * @throws Error if not authenticated
 */
export async function getCurrentUser(
  supabase: SupabaseClient<Database>
): Promise<User | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Check if user is authenticated, throw if not
 * @throws Error if not authenticated
 */
export async function requireAuth(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: User not authenticated');
  }
}

/**
 * Check if user is admin, throw if not
 * @throws Error if not admin
 */
export async function requireAdmin(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const user = await getCurrentUser(supabase);

  if (!user || !isAdmin(user)) {
    throw new Error('Forbidden: Admin access required');
  }
}

/**
 * Get the user's organization
 * @throws Error if user not authenticated or has no organization
 */
export async function getUserOrganization(
  supabase: SupabaseClient<Database>
): Promise<Organization> {
  const user = await getCurrentUser(supabase);

  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!user.organization_id) {
    throw new Error('User does not have an organization');
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.organization_id)
    .single();

  if (error) {
    throw new Error(`Error fetching organization: ${error.message}`);
  }

  return data;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}
