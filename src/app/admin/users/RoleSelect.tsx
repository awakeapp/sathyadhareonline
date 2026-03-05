'use client';

import { useRef, useTransition } from 'react';
import { Select } from '@/components/ui/Input';

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
    <form ref={formRef} className="flex items-center gap-3">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="role"
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="h-9 py-1 text-xs bg-[var(--color-surface-2)]"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r] ?? r}
          </option>
        ))}
      </Select>
      {isPending && (
        <span className="text-[10px] text-[var(--color-muted)] animate-pulse font-bold tracking-widest uppercase">
          Saving
        </span>
      )}
    </form>
  );
}
