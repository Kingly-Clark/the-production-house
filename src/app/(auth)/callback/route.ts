// Production House — OAuth Callback Handler
// Exchanges auth code for session and redirects
// =============================================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to dashboard or specified redirect path
      return NextResponse.redirect(
        new URL(redirect, request.url).toString()
      );
    }
  }

  // Return error response
  return NextResponse.redirect(
    new URL('/login?error=Failed to authenticate', request.url).toString()
  );
}
