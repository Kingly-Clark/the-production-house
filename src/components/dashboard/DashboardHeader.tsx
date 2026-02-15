'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

interface User {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        const orgRes = await fetch('/api/auth/organization');
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrg(orgData.name);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-slate-400"
        >
          <Menu className="w-5 h-5" />
        </Button>
        {org && <p className="text-sm text-slate-400">{org}</p>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white"
        >
          <Bell className="w-5 h-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-10 p-0 rounded-full"
            >
              <Avatar className="h-10 w-10">
                {user?.avatar_url && (
                  <img src={user.avatar_url} alt={user.full_name || 'User'} />
                )}
                <AvatarFallback className="bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-slate-900 border-slate-800"
          >
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium text-white">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="text-slate-300 cursor-pointer hover:text-white"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 cursor-pointer hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
