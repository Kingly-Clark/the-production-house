'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  Settings,
  Menu,
  X,
  FileText,
  Users,
  Link as LinkIcon,
  Share2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const siteId = params.siteId as string | undefined;

  const mainNav = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Sites', href: '/dashboard/sites', icon: Globe },
    { label: 'Billing', href: '/dashboard/billing', icon: Zap },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const siteNav = siteId
    ? [
        {
          label: 'Overview',
          href: `/dashboard/sites/${siteId}`,
          icon: LayoutDashboard,
        },
        {
          label: 'Articles',
          href: `/dashboard/sites/${siteId}/articles`,
          icon: FileText,
        },
        {
          label: 'Sources',
          href: `/dashboard/sites/${siteId}/sources`,
          icon: LinkIcon,
        },
        {
          label: 'Subscribers',
          href: `/dashboard/sites/${siteId}/subscribers`,
          icon: Users,
        },
        {
          label: 'Domain',
          href: `/dashboard/sites/${siteId}/domain`,
          icon: Globe,
        },
        {
          label: 'Backlinks',
          href: `/dashboard/sites/${siteId}/backlinks`,
          icon: Link as any,
        },
        {
          label: 'Social',
          href: `/dashboard/sites/${siteId}/social`,
          icon: Share2,
        },
        {
          label: 'Settings',
          href: `/dashboard/sites/${siteId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(!open)}
          className="text-slate-400"
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Sidebar overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative w-64 h-screen bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto transition-all duration-300 z-40',
          !open && '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="mb-8 pt-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg" />
            <span className="font-bold text-white">Production</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1 mb-8">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Site Navigation */}
        {siteNav.length > 0 && (
          <>
            <div className="border-t border-slate-700 pt-4 mb-4">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Site Menu
              </p>
            </div>

            <div className="space-y-1">
              {siteNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
