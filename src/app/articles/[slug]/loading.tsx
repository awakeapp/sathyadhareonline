export default function ArticleLoading() {
  return (
    <div className="min-h-[100svh] px-4 py-8 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-3xl animate-pulse">
      {/* Category pill skeleton */}
      <div className="w-24 h-6 rounded-full bg-[var(--color-surface-2)] mb-5" />

      {/* Title skeleton — 3 lines */}
      <div className="space-y-3 mb-4">
        <div className="h-9 w-full rounded-xl bg-[var(--color-surface-2)]" />
        <div className="h-9 w-5/6 rounded-xl bg-[var(--color-surface-2)]" />
        <div className="h-9 w-3/5 rounded-xl bg-[var(--color-surface-2)]" />
      </div>

      {/* Meta row skeleton */}
      <div className="flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-28 h-4 rounded-full bg-[var(--color-surface-2)]" />
          <div className="w-16 h-4 rounded-full bg-[var(--color-surface-2)]" />
        </div>
        <div className="w-16 h-8 rounded-xl bg-[var(--color-surface-2)]" />
      </div>

      {/* Author row skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-[var(--color-surface-2)]" />
        <div className="w-32 h-4 rounded-full bg-[var(--color-surface-2)]" />
      </div>

      {/* Share buttons skeleton */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-7 rounded-full bg-[var(--color-surface-2)]" />
        ))}
      </div>

      {/* Hero image skeleton */}
      <div className="w-full aspect-[4/3] sm:aspect-video rounded-[2rem] bg-[var(--color-surface-2)] mb-10" />

      {/* Article body skeleton lines */}
      <div className="space-y-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-full bg-[var(--color-surface-2)]"
            style={{ width: i % 4 === 3 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  );
}
