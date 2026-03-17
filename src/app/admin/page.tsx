import { Suspense } from 'react';
import { GlobalSearchBar } from '@/components/PresenceUI';
import DashboardMetrics from './DashboardMetrics';
import nextDynamic from 'next/dynamic';

const AccessDeniedBanner = nextDynamic(() => import('./AccessDeniedBanner'));


export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Access Denied notice (appears when ?denied=1 is in the URL) */}
      <Suspense fallback={null}>
        <AccessDeniedBanner />
      </Suspense>

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
