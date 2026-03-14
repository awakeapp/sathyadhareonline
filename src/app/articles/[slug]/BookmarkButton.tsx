'use client';

import { useTransition, useState } from 'react';
import { toast } from 'sonner';

interface Props {
  articleId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  saveAction: (articleId: string) => Promise<void>;
  removeAction: (articleId: string) => Promise<void>;
}

export function BookmarkButton({ articleId, initialSaved, isAuthenticated, saveAction, removeAction }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!isAuthenticated) {
      toast.error('Please login to save articles!');
      return;
    }

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
        group h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl text-xs font-bold
        transition-all duration-200 border
        disabled:opacity-60 disabled:cursor-wait
        ${saved
          ? 'bg-[#685de6]/10 border-[#685de6]/30 text-[#685de6]'
          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[#685de6] hover:border-[#685de6]/30'
        }
      `}
    >
      <svg
        className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-[#685de6]' : 'fill-none group-hover:fill-[#685de6]/20'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
