'use client';

import { useEffect } from 'react';
import { LogIn, UserPlus, X, BookmarkCheck } from 'lucide-react';

interface AuthPromptSheetProps {
  open: boolean;
  onClose: () => void;
  returnTo?: string;
  message?: string;
}

export default function AuthPromptSheet({
  open,
  onClose,
  returnTo,
  message = 'Sign in to save articles and highlights',
}: AuthPromptSheetProps) {
  const encodedReturn = returnTo ? encodeURIComponent(returnTo) : '';

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet: slides up from bottom on mobile, centred modal on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in required"
        className={`
          fixed z-[201] inset-x-0 bottom-0
          sm:inset-0 sm:flex sm:items-center sm:justify-center sm:pointer-events-none
          animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300
        `}
      >
        <div
          className={`
            relative w-full sm:w-auto sm:min-w-[380px] sm:max-w-md
            bg-[var(--color-surface)] border border-[var(--color-border)]
            rounded-t-[2rem] sm:rounded-[2rem]
            shadow-2xl
            px-6 pt-8 pb-10 sm:p-8
            flex flex-col items-center gap-6
            sm:pointer-events-auto
          `}
          onClick={e => e.stopPropagation()}
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Drag handle (mobile only) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[var(--color-border)] sm:hidden" />

          {/* Close button (desktop) */}
          <button
            onClick={onClose}
            className="hidden sm:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--color-surface-2)] items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
            <BookmarkCheck size={28} strokeWidth={2} />
          </div>

          {/* Message */}
          <div className="text-center">
            <h2 className="text-[18px] font-bold text-[var(--color-text)] leading-snug">
              {message}
            </h2>
            <p className="text-[14px] text-[var(--color-muted)] mt-2 font-medium leading-relaxed">
              Create a free account or sign in to unlock your personal reading dashboard.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full">
            <a
              href={`/sign-in${encodedReturn ? `?return_to=${encodedReturn}` : ''}`}
              className="flex items-center justify-center gap-2.5 h-12 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-[14px] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              <LogIn size={18} strokeWidth={2.5} />
              Sign In
            </a>
            <a
              href={`/signup${encodedReturn ? `?return_to=${encodedReturn}` : ''}`}
              className="flex items-center justify-center gap-2.5 h-12 rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] font-bold text-[14px] border border-[var(--color-border)] hover:bg-[var(--color-border)] active:scale-[0.98] transition-all"
            >
              <UserPlus size={18} strokeWidth={2.5} />
              Create Account
            </a>
          </div>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-text)] font-semibold transition-colors sm:hidden"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
