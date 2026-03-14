import { Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function VideosPage() {
  return (
    <div className="min-h-[100svh] px-4 py-4 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl border-t border-[var(--color-border)]">
      <div className="pt-3 pb-5 border-b border-[var(--color-border)] mb-6">
        <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight">Videos</h1>
      </div>

      <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4">
        <div className="w-20 h-20 rounded-3xl bg-red-500/5 flex items-center justify-center text-red-500 mb-6">
          <Play size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2 uppercase tracking-[0.1em]">
          Videos Coming Soon
        </h2>
        <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed">
          Our video team is in production! High-quality video stories and visual journalism will be launching here very soon.
        </p>
        <div className="mt-8 px-6 py-2 rounded-full border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
          Coming Soon
        </div>
      </Card>
    </div>
  );
}
