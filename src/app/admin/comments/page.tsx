import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// ── Server Actions ────────────────────────────────────────────────────────────
// Each action re-verifies the caller's role before mutating data.

async function approveComment(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id = formData.get('id') as string;
  await supabase.from('comments').update({ status: 'approved' }).eq('id', id);
  revalidatePath('/admin/comments');
  redirect('/admin/comments');
}

async function rejectComment(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id = formData.get('id') as string;
  await supabase.from('comments').update({ status: 'rejected' }).eq('id', id);
  revalidatePath('/admin/comments');
  redirect('/admin/comments');
}

async function deleteComment(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id = formData.get('id') as string;
  await supabase.from('comments').delete().eq('id', id);
  revalidatePath('/admin/comments');
  redirect('/admin/comments');
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminCommentsPage() {
  const supabase = await createClient();

  // ── Auth guard: admin / super_admin only ─────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  // ── Data: join comments ↔ articles to get readable titles ─────────────
  // The foreign key relationship: comments.article_id → articles.id
  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      id,
      article_id,
      guest_name,
      user_id,
      content,
      status,
      created_at,
      articles ( title )
    `)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching comments:', error);

  // Helper: status badge colors
  const statusColors: Record<string, string> = {
    pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const pendingCount = comments?.filter(c => c.status === 'pending').length ?? 0;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Comment Moderation</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {pendingCount} pending · {comments?.length ?? 0} total
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30">
              {pendingCount}
            </span>
          )}
        </div>

        {/* ── List ────────────────────────────────────────────────── */}
        {!comments || comments.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
            <p className="font-semibold text-white mb-1">No comments yet</p>
            <p className="text-sm">Comments from readers will appear here for moderation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              // The joined articles row is either an object or null
              const articleTitle = (c.articles as { title?: string } | null)?.title ?? null;

              return (
                <div
                  key={c.id}
                  className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 transition-all ${
                    c.status !== 'pending' ? 'opacity-55' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 flex-wrap">

                    {/* Left: comment info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Author + status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {c.guest_name || 'Registered User'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[c.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Article title (was UUID before) */}
                      <p className="text-xs text-[var(--color-muted)]">
                        On article:{' '}
                        {articleTitle ? (
                          <span className="text-[#4f8ef7] font-semibold">{articleTitle}</span>
                        ) : (
                          <span className="font-mono text-[10px] opacity-50">{c.article_id}</span>
                        )}
                        {' · '}
                        {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>

                      {/* Comment body */}
                      <p className="text-sm text-[var(--color-muted)] line-clamp-3 mt-1">{c.content}</p>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {c.status === 'pending' && (
                        <>
                          <form action={approveComment}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-colors uppercase"
                            >
                              ✓ Approve
                            </button>
                          </form>
                          <form action={rejectComment}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs font-bold tracking-wide text-gray-400 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-xl transition-colors uppercase"
                            >
                              Reject
                            </button>
                          </form>
                        </>
                      )}
                      <form action={deleteComment}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-bold tracking-wide text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors uppercase"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
