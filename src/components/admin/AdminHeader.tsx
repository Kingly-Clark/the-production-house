// Admin Header — Top header with branding and user info

'use client';

import { Bell, Settings, User } from 'lucide-react';
import type { User as UserType } from '@/types/database';

interface AdminHeaderProps {
  user: UserType;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-900/20 p-2">
          <div className="h-5 w-5 text-amber-400 font-bold">⚙</div>
        </div>
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* Settings */}
        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 transition-colors">
          <Settings className="h-5 w-5" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
          <User className="h-4 w-4" />
          <span className="truncate max-w-xs">{user.full_name || user.email}</span>
        </button>
      </div>
    </header>
  );
}
