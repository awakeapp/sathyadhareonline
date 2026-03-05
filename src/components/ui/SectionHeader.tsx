'use client';

interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 mt-8 px-2">
      <h2 className="text-sm font-black text-[var(--color-text)] tracking-tight">
        {title}
      </h2>
      <div className="flex gap-2">
        <button
          className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-80 transition-opacity disabled:opacity-30"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-primary)] text-black hover:opacity-80 transition-opacity"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
