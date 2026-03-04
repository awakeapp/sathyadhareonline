'use client';

import { useTransition } from 'react';

interface Props {
  articleId: string;
  articleTitle: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DeleteArticleButton({ articleId, articleTitle, deleteAction }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Delete "${articleTitle}"?\n\nThis will hide the article from the site. You can restore it later.`
    );
    if (!confirmed) return;

    const fd = new FormData();
    fd.append('id', articleId);
    startTransition(() => deleteAction(fd));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-wait"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
