'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export function CommentBox({ userInitial, isAuthenticated }: { userInitial: string, isAuthenticated: boolean }) {
  function handleClick() {
    if (!isAuthenticated) {
      toast.error('Please log in to leave a comment!');
    }
  }

  return (
    <Card className="w-full mb-12 shadow-none border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]" onClick={handleClick}>
      <CardContent className="p-4 sm:p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex-shrink-0 flex items-center justify-center text-black font-black text-sm">
          {userInitial}
        </div>
        <Input 
          readOnly={!isAuthenticated} 
          placeholder="Leave a comment..." 
          className="border-none bg-transparent shadow-none px-0 focus-visible:ring-0 placeholder:text-[var(--color-muted)] font-semibold cursor-text" 
        />
      </CardContent>
    </Card>
  );
}
