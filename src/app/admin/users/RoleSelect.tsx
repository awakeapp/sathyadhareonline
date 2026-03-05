'use client';

import { useRef, useTransition } from 'react';

const ROLES = ['reader', 'editor', 'admin'] as const;

const ROLE_LABELS: Record<string, string> = {
  reader:    'Reader',
  editor:    'Editor',
  admin:     'Admin',
};

interface Props {
  userId: string;
  currentRole: string;
  updateRole: (formData: FormData) => Promise<void>;
}

export function RoleSelect({ userId, currentRole, updateRole }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(() => updateRole(formData));
  }

  return (
    <form ref={formRef} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-xl border px-3 py-1.5 text-xs font-bold bg-black/30 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 disabled:opacity-50 disabled:cursor-wait transition-all appearance-none cursor-pointer hover:border-white/20"
      >
        {ROLES.map((r) => (
          <option key={r} value={r} className="bg-[#181623]">
            {ROLE_LABELS[r] ?? r}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-[10px] text-[var(--color-muted)] animate-pulse font-semibold">
          saving…
        </span>
      )}
    </form>
  );
}
