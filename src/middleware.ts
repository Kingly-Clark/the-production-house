// Production House — Next.js Middleware
// Handles authentication, route protection, and multi-tenant routing
// =============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/callback',
  '/auth/callback',
  '/forgot-password',
  '/reset-password',
  '/pricing',
];

// API routes that are public
const PUBLIC_API_ROUTES = [
  '/api/auth/',
  '/api/public/',
  '/api/webhooks/',
  '/api/stripe/',
];

// Routes that require admin access
const ADMIN_ROUTES = ['/admin'];

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/settings'];

// Helper function to get auth token from cookies
function getAuthFromCookies(request: NextRequest): { accessToken?: string; refreshToken?: string } {
  const allCookies = request.cookies.getAll();
  
  // Try to find the Supabase auth cookie
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        // Try base64 decode first
        const decoded = Buffer.from(cookie.value.split('.')[0] || cookie.value, 'base64').toString();
        const parsed = JSON.parse(decoded);
        return { accessToken: parsed.access_token, refreshToken: parsed.refresh_token };
      } catch {
        try {
          const parsed = JSON.parse(cookie.value);
          return { accessToken: parsed.access_token, refreshToken: parsed.refresh_token };
        } catch {
          // Not JSON
        }
      }
    }
  }
  
  // Fallback to individual cookies
  return {
    accessToken: request.cookies.get('sb-access-token')?.value,
    refreshToken: request.cookies.get('sb-refresh-token')?.value,
  };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware');
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Get the hostname for custom domain routing
  const hostname = request.headers.get('host') || '';

  // Check if this is a custom domain (not our main domain)
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'localhost:3000';
  const isCustomDomain = !hostname.includes(mainDomain) && 
                         !hostname.includes('localhost') && 
                         !hostname.includes('vercel.app');

  // Handle custom domain routing to public site view
  if (isCustomDomain && !pathname.startsWith('/api') && !pathname.startsWith('/s/')) {
    const newUrl = new URL(`/s/${hostname}${pathname}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // Skip middleware for API routes (they have their own auth)
  if (pathname.startsWith('/api/')) {
    return response;
  }

  // Skip middleware for public site routes
  if (pathname.startsWith('/s/')) {
    return response;
  }

  // Check if route is public
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return response;
  }

  // Check auth status using standard Supabase client
  try {
    const { accessToken, refreshToken } = getAuthFromCookies(request);
    
    // If no tokens and trying to access protected route, redirect to login
    if (!accessToken) {
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
          ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // Create client and verify session
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Verify the session is valid
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Invalid session, redirect to login for protected routes
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
          ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // Check admin routes
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>();

      if (!userData || userData.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login for protected routes
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
        ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.svg).*)',
  ],
};
