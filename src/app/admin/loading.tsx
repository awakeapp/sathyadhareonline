export default function AdminLoading() {
  return (
    <div className="font-sans antialiased min-h-screen pb-28 animate-pulse bg-gray-50/50 dark:bg-transparent">
      {/* Presence Header Skeleton */}
      <div className="h-44 bg-zinc-950 relative overflow-hidden flex items-center px-8 border-b border-white/5">
         <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-white/5" />
               <div className="space-y-3">
                  <div className="h-6 w-48 bg-white/10 rounded-lg" />
                  <div className="h-3 w-32 bg-white/5 rounded-md" />
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white/5" />
               <div className="w-12 h-12 rounded-2xl bg-white/5" />
               <div className="w-12 h-12 rounded-full bg-white/10 ml-4" />
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
