'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, User, Clock } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  guest_name: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}

export function CommentList({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, guest_name, profiles(full_name)')
        .eq('article_id', articleId)
        .eq('status', 'approved')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        setComments(data as any || []);
      }
      setLoading(false);
    }

    fetchComments();

    // subscribe to new approved comments
    const supabase = createClient();
    const channel = supabase
      .channel('comments-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_id=eq.${articleId}` },
        (payload) => {
          const newComment = payload.new as any;
          if (newComment.status === 'approved') {
             // In real app, we'd fetch profile data too, but for live updates simplicity:
             setComments(prev => [newComment, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-24 bg-[var(--color-surface-2)] rounded-2xl w-full" />)}
    </div>
  );

  if (comments.length === 0) return null;

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center min-w-[44px] min-h-[44px]">
          <MessageSquare size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-[17px] font-black text-[var(--color-text)] uppercase tracking-tight">
          Community Feed <span className="text-[var(--color-muted)] ml-1">({comments.length})</span>
        </h3>
      </div>

      <div className="space-y-4">
        {comments.map((c) => {
          const name = c.guest_name || c.profiles?.full_name || 'Anonymous Reader';
          return (
            <div key={c.id} className="p-5 rounded-3xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/20 transition-all shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] min-w-[44px] min-h-[44px]">
                  <User size={14} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-[var(--color-text)] truncate">{name}</p>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <Clock size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                       {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-[var(--color-text)]/80 font-medium">
                {c.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
