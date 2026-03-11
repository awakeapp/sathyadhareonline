import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import AuditLogsClient from './AuditLogsClient';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const supabase = await createClient();

  // ── Auth guard ───────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  // ── Fetch User List for Select Dropdown ──────────────────────────────
  // Fetch profiles that have performed at least one action, or just fetch all admins/super_admins.
  // Easiest is to fetch all profiles as the dropdown options, mapping id & email/name.
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name', { ascending: true });

  const usersList = (profiles || []).map(p => ({
    id: p.id,
    name: p.full_name || '',
    email: p.email || ''
  }));

  if (error) {
    console.error('Error fetching users for audit logs:', error);
  }

  // We could fetch total count purely for the header, but AuditLogsClient loads it dynamically.
  // We'll just pass down the user list for the filter.
  
  return (
    <div className="font-sans antialiased max-w-7xl mx-auto py-2 px-4 pb-24">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">System Audit Matrix</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            Immutable Activity Timeline
          </p>
        </div>
      </div>

      <AuditLogsClient usersList={usersList} />
    </div>
  );
}
