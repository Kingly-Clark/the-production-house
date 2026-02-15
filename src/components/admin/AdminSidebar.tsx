// Admin Sidebar — Navigation menu for admin panel

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Globe,
  FileText,
  Zap,
  AlertCircle,
  Settings,
  LogOut,
} from 'lucide-react';
import type { User } from '@/types/database';

interface AdminSidebarProps {
  user: User;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/organizations', icon: Building2, label: 'Organizations' },
    { href: '/admin/sites', icon: Globe, label: 'Sites' },
    { href: '/admin/articles', icon: FileText, label: 'Articles' },
    { href: '/admin/jobs', icon: Zap, label: 'Jobs' },
    { href: '/admin/alerts', icon: AlertCircle, label: 'Alerts' },
    { href: '/admin/system', icon: Settings, label: 'System' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-xl font-bold text-white">Production</h1>
        <p className="mt-1 text-xs text-amber-400 font-semibold">ADMIN</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-amber-900/30 text-amber-400 border-l-2 border-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800 p-4 space-y-3">
        <div className="rounded-lg bg-slate-800 px-4 py-3">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-semibold text-white truncate">
            {user.full_name || user.email}
          </p>
        </div>
        <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
