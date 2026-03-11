export default function AdminLoading() {
  return (
    <div className="font-sans antialiased max-w-5xl mx-auto px-1 py-2 pb-28 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 mb-6 mt-2 h-[140px]" />

      {/* Overview Skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-32 bg-[var(--color-surface)] rounded-md" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 h-[120px]" />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-24 bg-[var(--color-surface)] rounded-md" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-[100px]" />
        ))}
      </div>

      {/* Main Content Areas Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-32 bg-[var(--color-surface)] rounded-md" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] h-16 w-full" />
          ))}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-40 bg-[var(--color-surface)] rounded-md" />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] h-[240px] w-full" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-24 bg-[var(--color-surface)] rounded-md" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] h-16 w-full" />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-32 bg-[var(--color-surface)] rounded-md" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] h-[100px] w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
