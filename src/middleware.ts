// Production House — Next.js Middleware
// Handles authentication, route protection, and multi-tenant routing
// =============================================================
// NOTE: Using @supabase/supabase-js directly to match client-side (H6 fix)

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

// Helper to parse auth token from our custom cookie
function getSessionFromCookie(request: NextRequest): { access_token: string; refresh_token: string } | null {
  const authCookie = request.cookies.get('sb-auth-token');
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware');
    return NextResponse.next();
  }

  // Create response to pass through
  let response = NextResponse.next({
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

  // Check authentication using our custom cookie
  try {
    const sessionData = getSessionFromCookie(request);
    
    // If no session and trying to access protected route, redirect to login
    if (!sessionData) {
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
          ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // For admin routes, we need to verify the user's role
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      // Create a Supabase client with the session token
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${sessionData.access_token}`,
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single<{ role: string }>();

        if (!userData || userData.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } else {
        // Token invalid, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
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
