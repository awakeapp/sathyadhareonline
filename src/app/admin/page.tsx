import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Send, Bell } from 'lucide-react';
import { 
  PresenceWrapper,
  PresenceHeader, 
  GlobalSearchBar
} from '@/components/PresenceUI';
import DashboardMetrics from './DashboardMetrics';
import ReaderModeSwitch from '@/components/ReaderModeSwitch';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let profile: { full_name: string | null; role: string } | null = null;
  try {
    const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
    profile = p;
  } catch { /* ignore */ }

  const role = profile?.role;
  if (!role || (role !== 'super_admin' && role !== 'admin')) redirect('/');

  const isSuperAdmin = role === 'super_admin';
  const initials  = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();
  const roleLabel = isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard';

  return (
    <PresenceWrapper className="bg-[#f0f2f5] dark:bg-[#0b141a]">
      {/* ── Presence Header ── */}
      <PresenceHeader 
        title="Super Admin"
        roleLabel={roleLabel}
        initials={initials}
        icon1Node={<Send className="w-5 h-5" strokeWidth={1.5} />}
        icon2Node={<Bell className="w-5 h-5" strokeWidth={1.5} />}
        icon1Href="/admin/submissions"
        icon2Href="/admin/audit-logs"
      />

      <div className="w-full space-y-4 sm:space-y-6 pt-2">
        
        {/* Modern Horizontal Search Bar */}
        <GlobalSearchBar />

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardMetrics />
        </Suspense>

        <div className="pt-2">
          <ReaderModeSwitch role={profile?.role as 'super_admin' | 'admin' | 'editor' | 'reader'} />
        </div>

      </div>
    </PresenceWrapper>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-[var(--color-surface-2)] rounded-md mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[var(--color-surface-2)] rounded-3xl" />
          ))}
        </div>
      </div>
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-[var(--color-surface-2)] rounded-md mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[160px] bg-[var(--color-surface-2)] rounded-3xl" />
          ))}
        </div>
      </div>
      <div className="animate-pulse">
        <div className="h-10 w-full mb-4 bg-[var(--color-surface-2)] rounded-xl" />
        <div className="h-64 bg-[var(--color-surface-2)] rounded-3xl" />
      </div>
    </>
  );
}
