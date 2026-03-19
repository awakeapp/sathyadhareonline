import AdminContainer from '@/components/layout/AdminContainer';
import { ChevronRight } from 'lucide-react';

export default function ManageLoading() {
  const sections = Array.from({ length: 3 });
  const rows = Array.from({ length: 4 });

  return (
    <AdminContainer className="pt-6 pb-[calc(var(--bottom-nav-height)+1rem)]">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Manage</h1>
      
      <div className="flex flex-col space-y-6">
        {sections.map((_, sIdx) => (
          <div key={sIdx}>
            <div className="w-24 h-3 bg-[var(--color-surface-2)] rounded animate-pulse mb-3 ml-2" />
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[14px] overflow-hidden flex flex-col divide-y divide-[var(--color-border)]">
              {rows.map((_, rIdx) => (
                <div key={rIdx} className="flex items-center gap-[12px] p-[13px_16px]">
                  <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--color-surface-2)] animate-pulse shrink-0" />
                  
                  <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                    <div className="h-4 w-28 bg-[var(--color-surface-2)] rounded animate-pulse" />
                    <div className="h-3 w-40 bg-[var(--color-surface-2)] rounded animate-pulse" />
                  </div>

                  <div className="h-5 w-14 rounded-full bg-[var(--color-surface-2)] animate-pulse shrink-0 mr-[8px]" />

                  <ChevronRight size={20} className="text-[var(--color-muted)] opacity-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminContainer>
  );
}
