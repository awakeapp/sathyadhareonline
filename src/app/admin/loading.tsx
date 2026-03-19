export default function AdminLoading() {
  return (
    <div className="min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)] animate-pulse bg-gray-50/50 dark:bg-transparent pt-4">
      <div className="w-full flex flex-col gap-4 relative z-20 max-w-[1400px] mx-auto px-4">
        {/* Top Cards Skeleton */}
        <div className="h-28 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)]" />

        {/* Medium Cards Skeleton */}
        <div className="h-64 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)]" />

        {/* Small Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="h-44 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)]" />
          <div className="h-44 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)]" />
          <div className="h-44 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)]" />
        </div>

        {/* Large Block Skeleton */}
        <div className="h-[400px] bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)]" />
      </div>
    </div>
  );
}
