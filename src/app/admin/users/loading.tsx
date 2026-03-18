export default function AdminLoading() {
  return (
    <div className="font-sans antialiased min-h-screen pb-28 animate-pulse bg-gray-50/50 dark:bg-transparent">
      {/* Presence Header Skeleton */}
      <div className="h-32 bg-[var(--color-surface)] relative overflow-hidden flex items-center px-6 border-b border-[var(--color-border)] rounded-3xl mb-4 shadow-sm">
         <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)]" />
               <div className="space-y-2">
                  <div className="h-5 w-40 bg-[var(--color-surface-2)] rounded-lg" />
                  <div className="h-3 w-28 bg-[var(--color-muted)]/10 rounded-md" />
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)]" />
               <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)]" />
               <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] ml-2" />
            </div>
         </div>
      </div>

      <div className="w-full flex flex-col gap-4 relative z-20 max-w-[1400px] mx-auto">
        {/* Attendance Card Skeleton */}
        <div className="h-28 bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-sm border border-indigo-50 dark:border-white/5 p-8" />

        {/* Status Card Skeleton */}
        <div className="h-64 bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-sm border border-indigo-50 dark:border-white/5 p-8" />

        {/* Real-time Analytics Skeleton */}
        <div className="grid grid-cols-3 gap-6">
          <div className="h-44 bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-sm border border-indigo-50 dark:border-white/5" />
          <div className="h-44 bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-sm border border-indigo-50 dark:border-white/5" />
          <div className="h-44 bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-sm border border-indigo-50 dark:border-white/5" />
        </div>

        {/* Action Grid Skeleton */}
        <div className="h-[400px] bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-sm border border-indigo-50 dark:border-white/5" />
      </div>
    </div>
  );
}
