'use client';

import dynamic from 'next/dynamic';

// Load TipTap only on client — prevents SSR hydration mismatch
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col bg-[#13121f] border border-white/10 rounded-2xl overflow-hidden min-h-[480px]">
      {/* Skeleton toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/8 bg-white/[0.03]">
        {[40, 40, 40, 1, 32, 32, 32, 1, 32, 32, 1, 32, 32, 1, 32, 32].map((w, i) =>
          w === 1 ? (
            <span key={i} className="w-px h-5 bg-white/10 mx-0.5" />
          ) : (
            <span key={i} className="animate-pulse rounded-lg bg-white/8" style={{ width: w, height: 32 }} />
          )
        )}
      </div>
      {/* Skeleton content */}
      <div className="flex-1 p-5 space-y-3">
        <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-2/3 mt-2" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-4/5" />
      </div>
    </div>
  ),
});

export default RichTextEditor;
