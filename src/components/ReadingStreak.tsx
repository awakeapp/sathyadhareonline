'use client';

import { Flame } from 'lucide-react';

interface Props {
  streak: number;
  className?: string;
}

export default function ReadingStreak({ streak, className = '' }: Props) {
  if (streak <= 0) return null;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 shadow-sm ${className}`}>
      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
      <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none">
        {streak} Day Streak
      </span>
      {streak >= 7 && (
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Weekly Goal Reached!" />
      )}
    </div>
  );
}
