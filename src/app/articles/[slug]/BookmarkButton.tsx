'use client';

import { useTransition, useState } from 'react';

interface Props {
  articleId: string;
  initialSaved: boolean;
  saveAction: (articleId: string) => Promise<void>;
  removeAction: (articleId: string) => Promise<void>;
}

export function BookmarkButton({ articleId, initialSaved, saveAction, removeAction }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next); // optimistic update

    startTransition(async () => {
      try {
        if (next) {
          await saveAction(articleId);
        } else {
          await removeAction(articleId);
        }
      } catch {
        setSaved(!next); // revert on error
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={saved ? 'Remove bookmark' : 'Save article'}
      className={`
        group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
        uppercase tracking-widest transition-all duration-200 border
        disabled:opacity-60 disabled:cursor-wait
        ${saved
          ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20'
          : 'bg-white/5 border-white/10 text-[#a3a0b5] hover:text-yellow-400 hover:border-yellow-400/30'
        }
      `}
    >
      <svg
        className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-yellow-400' : 'fill-none group-hover:fill-yellow-400/30'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
