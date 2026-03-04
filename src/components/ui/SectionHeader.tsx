'use client';

interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 mt-8 px-2">
      <h2 className="text-sm font-black text-white tracking-tight">
        {title}
      </h2>
      <div className="flex gap-2">
        <button
          className="w-5 h-5 rounded-full flex items-center justify-center bg-[#8b889a] text-[#181623] hover:opacity-80 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="w-5 h-5 rounded-full flex items-center justify-center bg-[#ffe500] text-[#181623] hover:opacity-80 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
