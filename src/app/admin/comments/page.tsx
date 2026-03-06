import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { logAuditEvent } from '@/lib/audit';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, MessageSquare, CheckCircle2, X, Trash2 } from 'lucide-react';

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
  
  await logAuditEvent(user.id, 'COMMENT_APPROVED', { comment_id: id });
  
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
  
  await logAuditEvent(user.id, 'COMMENT_REJECTED', { comment_id: id });
  
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
  await supabase
    .from('comments')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  await logAuditEvent(user.id, 'COMMENT_DELETED', { comment_id: id });
  
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
    .eq('is_deleted', false)
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
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
              <Link href="/admin">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">Comment Moderation</h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {pendingCount} pending · {comments?.length ?? 0} total
              </p>
            </div>
          </div>
        </div>

        {/* ── List ────────────────────────────────────────────────── */}
        {!comments || comments.length === 0 ? (
          <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
            <p className="font-bold mb-1 text-lg tracking-tight">No comments yet</p>
            <p className="text-sm text-[var(--color-muted)]">Comments from readers will appear here for moderation.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              // The joined articles row is either an object or null
              const articleTitle = (c.articles as { title?: string } | null)?.title ?? null;

              return (
                <Card
                  key={c.id}
                  className={`overflow-hidden transition-all duration-300 border-transparent bg-[var(--color-surface)] shadow-none rounded-3xl ${
                    c.status !== 'pending' ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">

                    {/* Left: comment info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Author + status */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-bold text-white tracking-tight">
                          {c.guest_name || 'Registered User'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[c.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Article title */}
                      <p className="text-xs text-[var(--color-muted)] font-medium">
                        On article:{' '}
                        {articleTitle ? (
                          <span className="text-[#4f8ef7]">{articleTitle}</span>
                        ) : (
                          <span className="font-mono text-[10px] opacity-50">{c.article_id}</span>
                        )}
                        <span className="mx-1.5">·</span>
                        {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>

                      {/* Comment body */}
                      <p className="text-sm text-[var(--color-muted)] line-clamp-3 mt-2 leading-relaxed bg-[var(--color-background)] rounded-xl py-2 px-3 border border-[var(--color-border)]/50">
                        {c.content}
                      </p>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 border-t sm:border-t-0 border-[var(--color-border)] sm:pt-0">
                      {c.status === 'pending' && (
                        <>
                          <form action={approveComment} className="flex-1 sm:flex-none">
                            <input type="hidden" name="id" value={c.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="w-full text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                          </form>
                          <form action={rejectComment} className="flex-1 sm:flex-none">
                            <input type="hidden" name="id" value={c.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="w-full text-gray-400 border-gray-500/20 bg-gray-500/5 hover:bg-gray-500/10 hover:text-gray-400"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </form>
                        </>
                      )}
                      <form action={deleteComment} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id" value={c.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="w-full text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
