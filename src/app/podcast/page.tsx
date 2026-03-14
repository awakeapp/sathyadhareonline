import SectionHeader from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Mic } from 'lucide-react';

export default function PodcastPage() {
  return (
    <div className="min-h-[100svh] px-4 py-4 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl border-t border-[var(--color-border)]">
      <SectionHeader title="Sathyadhare Podcast" />

      <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4 animate-fade-up">
        <div className="w-20 h-20 rounded-3xl bg-[#685de6]/5 flex items-center justify-center text-[#685de6] mb-6">
          <Mic size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2 uppercase tracking-[0.1em]">
          Podcast Coming Soon
        </h2>
        <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed">
          We are currently setting up our studio! High-quality audio stories and interviews will be launching soon on this platform.
        </p>
        <div className="mt-8 px-6 py-2 rounded-full border border-[#685de6]/20 text-[#685de6] text-[10px] font-black uppercase tracking-widest">
           Stay Tuned
        </div>
      </Card>
    </div>
  );
}
