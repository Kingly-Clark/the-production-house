// Production House — Global Error Handler
// Handles unexpected errors in the app
// =============================================================

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="border-slate-700"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
