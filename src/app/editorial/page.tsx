import { Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function EditorialPage() {
  return (
    <div className="min-h-[100svh] px-4 py-4 pb-[calc(var(--bottom-nav-height)+1rem)] max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl border-t border-[var(--color-border)]">
      <div className="pt-3 pb-5 border-b border-[var(--color-border)] mb-6">
        <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight">Editorial</h1>
      </div>

      <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4">
        <div className="w-20 h-20 rounded-3xl bg-[#0ea5e9]/5 flex items-center justify-center text-[#0ea5e9] mb-6">
          <Layers size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2 uppercase tracking-[0.1em]">
          Editorial Coming Soon
        </h2>
        <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed">
          Our editorial board is preparing deeply researched opinion pieces and long-form commentary. Watch this space.
        </p>
        <div className="mt-8 px-6 py-2 rounded-full border border-[#0ea5e9]/20 text-[#0ea5e9] text-[10px] font-black uppercase tracking-widest">
          Coming Soon
        </div>
      </Card>
    </div>
  );
}
