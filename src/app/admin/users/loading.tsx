export default function UsersLoading() {
  return (
    <div className="font-sans antialiased min-h-screen pb-28 animate-pulse bg-gray-50/50 dark:bg-transparent pt-4">
      <div className="w-full flex flex-col gap-4 relative z-20 max-w-[1400px] mx-auto px-4">
        {/* Search Bar Skeleton */}
        <div className="h-14 bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] mb-2" />

        {/* User Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)] p-6" />
          ))}
        </div>
      </div>
    </div>
  );
}
