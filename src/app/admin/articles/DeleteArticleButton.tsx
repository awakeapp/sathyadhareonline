'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';

interface Props {
  articleId: string;
  articleTitle: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DeleteArticleButton({ articleId, articleTitle, deleteAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const fd = new FormData();
    fd.append('id', articleId);
    
    startTransition(async () => {
      try {
        await deleteAction(fd);
        toast.success(`Deleted "${articleTitle}" successfully.`);
        setIsOpen(false);
      } catch {
        toast.error('Failed to delete article. Please try again.');
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        variant="destructive"
        size="sm"
        className="w-full sm:w-auto"
      >
        Delete
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Article?</ModalTitle>
            <ModalDescription>
              This will hide <span className="font-bold text-white">&quot;{articleTitle}&quot;</span> from the site. 
              You can restore it later from the admin panel if needed.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={isPending}>
              Delete Article
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

