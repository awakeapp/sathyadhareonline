import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { GlobalSearchBar } from '@/components/PresenceUI';
import DashboardMetrics from './DashboardMetrics';
import nextDynamic from 'next/dynamic';

// Loaded client-side so useSearchParams is safe (ssr: false avoids Suspense requirement)
const AccessDeniedBanner = nextDynamic(() => import('./AccessDeniedBanner'), { ssr: false });


export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  let profile: { full_name: string | null; role: string } | null = null;
  try {
    const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
    profile = p;
  } catch { /* ignore */ }

  const role = profile?.role;
  if (!role || (role !== 'super_admin' && role !== 'admin')) redirect('/');

  return (
    /* The layout (AdminLayout → DashboardShell) already provides the
       fixed header + bottom nav + padding. This page only renders
       the scrollable inner content. */
    <div className="flex flex-col gap-4 w-full">

      {/* Access Denied notice (appears when ?denied=1 is in the URL) */}
      <AccessDeniedBanner />

      {/* Search */}
      <GlobalSearchBar />

      {/* Metrics */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardMetrics />
      </Suspense>

    </div>
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
    </>
  );
}
