'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';

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
    <Button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      variant="destructive"
      size="sm"
      className="w-full sm:w-auto"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
