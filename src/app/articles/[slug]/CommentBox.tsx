'use client';

import { useState, useTransition, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Loader2, SendHorizontal } from 'lucide-react';
import { submitComment } from '@/app/actions/comments';
import { createClient } from '@/lib/supabase/client';

export function CommentBox({ articleId, isAuthenticated }: { articleId: string, isAuthenticated: boolean }) {
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isClientAuth, setIsClientAuth] = useState(isAuthenticated);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsClientAuth(true);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsClientAuth(!!session?.user);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!comment.trim()) return;
    
    startTransition(async () => {
      const result = await submitComment(articleId, comment);
      if (result.success) {
        toast.success('Comment submitted! It will appear after moderation.');
        setComment('');
      } else {
        toast.error(result.error || 'Failed to send comment');
      }
    });
  };

  const handleClick = () => {
    if (!isClientAuth) {
      toast.error('Please log in to leave a comment!');
    }
  };

  return (
    <div className="w-full mt-8 mb-16" onClick={handleClick}>
      <div className="flex items-center gap-2 p-1.5 w-full rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] focus-within:border-[var(--color-primary)] transition-all">
        <Input 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!isClientAuth || isPending}
          placeholder={isClientAuth ? "Write a comment..." : "Sign in to join the conversation..."} 
          className="border-none bg-transparent shadow-none px-4 focus-visible:ring-0 placeholder:text-[var(--color-muted)]/40 font-medium text-[15px] cursor-text h-11" 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        
        {isClientAuth && (
          <button 
            onClick={handleSend}
            disabled={!comment.trim() || isPending}
            className="shrink-0 w-11 h-11 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 active:scale-90 disabled:opacity-30 disabled:scale-100 transition-all shadow-sm"
            aria-label="Send Comment"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
