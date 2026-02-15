// Production House — Dashboard Error Handler
// Handles errors within the dashboard
// =============================================================

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800 p-8 text-center">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-400"
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
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-4">
          There was an error loading this page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => reset()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            size="sm"
            variant="outline"
            className="border-slate-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
