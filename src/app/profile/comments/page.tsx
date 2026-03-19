import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, ArrowLeft, Clock, CheckCircle2, Clock3 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UserCommentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      status,
      created_at,
      article:articles(title, slug)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[var(--color-background)] pt-6 sm:pt-10 pb-[calc(var(--bottom-nav-height)+1rem)] px-4 sm:px-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Profile
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <MessageSquare size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">Your Comments</h1>
              <p className="text-sm font-medium text-[var(--color-muted)] mt-1">Manage your feedback and interactions</p>
            </div>
          </div>
        </header>

        {(!comments || comments.length === 0) ? (
          <div className="p-16 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center opacity-60">
            <MessageSquare size={48} className="text-[var(--color-muted)] mb-6" />
            <h3 className="text-xl font-black mb-2">No Comments Yet</h3>
            <p className="text-sm font-medium max-w-xs leading-relaxed">
              Join the conversation by sharing your thoughts on our latest articles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {comments.map((c: any) => (
              <div key={c.id} className="p-6 rounded-[2rem] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[var(--color-muted)] uppercase tracking-widest mb-1">On Article</p>
                    <Link href={`/articles/${c.article?.slug}`} className="text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate block">
                      {c.article?.title || 'Untitled Article'}
                    </Link>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0
                    ${c.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}>
                    {c.status === 'approved' ? <CheckCircle2 size={12} strokeWidth={3} /> : <Clock3 size={12} strokeWidth={3} />}
                    {c.status}
                  </div>
                </div>
                
                <p className="text-[15px] leading-relaxed text-[var(--color-text)]/80 italic font-medium">
                  &ldquo;{c.content}&rdquo;
                </p>

                <div className="flex items-center gap-2 opacity-40">
                  <Clock size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Posted on {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
