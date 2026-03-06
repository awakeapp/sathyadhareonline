import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/admin');

  // Fetch all users with profile and status
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, created_at')
    .order('full_name', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <div className="font-sans antialiased max-w-4xl mx-auto py-2 px-4 pb-20">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">Master User Management</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            {users?.length || 0} Registered Accounts · Access Control
          </p>
        </div>
      </div>

      <UserManagementClient users={(users as UserProfile[]) || []} />

    </div>
  );
}
