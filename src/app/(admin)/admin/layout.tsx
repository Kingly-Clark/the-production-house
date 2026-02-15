// Admin Layout — Top-level admin panel layout
// Provides sidebar navigation and main content area

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // Verify admin access
  if (!user || user.role !== 'admin') {
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900">
        <AdminSidebar user={user} />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        <div className="flex-1 overflow-auto bg-slate-950">
          {children}
        </div>
      </main>
    </div>
  );
}
