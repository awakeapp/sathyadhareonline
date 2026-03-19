import AdminContainer from '@/components/layout/AdminContainer';

export default function ArticlesLoading() {
  const rows = Array.from({ length: 8 });

  return (
    <AdminContainer className="pt-6 pb-[calc(var(--bottom-nav-height)+1rem)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Articles</h1>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[14px] overflow-hidden flex flex-col divide-y divide-[var(--color-border)]">
        {rows.map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="w-3 h-3 rounded-full bg-[var(--color-surface-2)] animate-pulse shrink-0" />
            
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="h-4 w-2/3 bg-[var(--color-surface-2)] rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-[var(--color-surface-2)] rounded animate-pulse" />
            </div>

            <div className="h-5 w-16 rounded-full bg-[var(--color-surface-2)] animate-pulse shrink-0 ml-auto" />
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </AdminContainer>
  );
}
