// Impersonation Banner — Warning banner when admin is viewing as client

'use client';

import { XCircle } from 'lucide-react';

interface ImpersonationBannerProps {
  orgName: string;
  onExit: () => void;
}

export default function ImpersonationBanner({ orgName, onExit }: ImpersonationBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-yellow-900/80 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <XCircle className="h-5 w-5 text-yellow-300" />
        <p className="text-sm font-semibold text-yellow-300">
          You are viewing as: <span className="font-bold">{orgName}</span>
        </p>
      </div>
      <button
        onClick={onExit}
        className="rounded bg-yellow-900 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-800 transition-colors"
      >
        Exit View
      </button>
    </div>
  );
}
