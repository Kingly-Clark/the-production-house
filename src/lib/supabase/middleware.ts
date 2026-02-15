// Production House — Supabase Middleware Helper
// This file is DEPRECATED - session is handled in the main middleware.ts
// Kept for reference only
// =============================================================

import type { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Session handling is now done in the main middleware.ts
  // using @supabase/supabase-js directly to avoid React 19 compatibility issues
  return response;
}
