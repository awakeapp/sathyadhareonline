'use client';

import { useRef, useTransition } from 'react';

const ROLES = ['reader', 'editor', 'moderator', 'admin'] as const;

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
    <form ref={formRef}>
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className={`
          rounded-lg border px-2.5 py-1.5 text-xs font-semibold
          bg-white dark:bg-gray-800
          border-gray-200 dark:border-gray-700
          text-gray-700 dark:text-gray-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          disabled:opacity-50 disabled:cursor-wait
          transition-opacity
        `}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 animate-pulse">
          saving…
        </span>
      )}
    </form>
  );
}
