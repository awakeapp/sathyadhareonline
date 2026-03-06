import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAuditEvent } from '@/lib/audit';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Inbox, CheckCircle2, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Server Actions ────────────────────────────────────────────────────────────
// These run entirely server-side; role is re-verified inside each action.

async function convertAction(formData: FormData) {
  'use server';
  const supabase = await createClient();

  // Re-verify role before mutating
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id      = formData.get('id')      as string;
  const title   = formData.get('title')   as string;
  const content = formData.get('content') as string;

  // Generate a URL-safe slug from the title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  const { error: articleError } = await supabase
    .from('articles')
    .insert({ title, content, slug, status: 'draft', author_id: user.id });

  if (articleError) {
    console.error('Convert error:', articleError);
    return;
  }

  await supabase.from('guest_submissions').update({ status: 'converted' }).eq('id', id);

  await logAuditEvent(user.id, 'SUBMISSION_CONVERTED', { submission_id: id, title });

  revalidatePath('/admin/submissions');
  revalidatePath('/admin/articles');
  redirect('/admin/submissions');
}

async function rejectAction(formData: FormData) {
  'use server';
  const supabase = await createClient();

  // Re-verify role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id = formData.get('id') as string;
  await supabase.from('guest_submissions').update({ status: 'rejected' }).eq('id', id);

  await logAuditEvent(user.id, 'SUBMISSION_REJECTED', { submission_id: id });

  revalidatePath('/admin/submissions');
  redirect('/admin/submissions');
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminSubmissionsPage() {
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
    // Editors and readers cannot access submissions
    redirect('/admin?error=unauthorized');
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: submissions, error } = await supabase
    .from('guest_submissions')
    .select('id, name, email, title, content, status, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching submissions:', error);

  const statusStyles: Record<string, string> = {
    pending:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    converted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected:  'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const pendingCount = submissions?.filter(s => s.status === 'pending').length ?? 0;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
              <Link href="/admin">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">Guest Submissions</h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {pendingCount} pending · {(submissions?.length ?? 0)} total
              </p>
            </div>
          </div>
        </div>

        {/* ── List ────────────────────────────────────────────────── */}
        {!submissions || submissions.length === 0 ? (
          <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
            <Inbox className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
            <p className="font-bold mb-1 text-lg tracking-tight">No submissions yet</p>
            <p className="text-sm text-[var(--color-muted)]">Reader-submitted articles will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                className={`overflow-hidden transition-all duration-300 border-transparent bg-[var(--color-surface)] shadow-none rounded-3xl ${
                  sub.status !== 'pending' ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 font-bold text-lg leading-tight tracking-tight flex flex-col gap-2">
                    
                    {/* Title + status badge */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-lg font-bold text-white tracking-tight truncate flex-1">{sub.title}</h2>
                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyles[sub.status] ?? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {sub.status}
                      </span>
                    </div>

                    {/* Author info */}
                    <p className="text-xs font-medium text-[var(--color-muted)]">
                      By <span className="font-semibold text-white">{sub.name}</span>
                      <span className="mx-1.5">·</span>
                      <a href={`mailto:${sub.email}`} className="text-[#4f8ef7] hover:underline font-mono">{sub.email}</a>
                      <span className="mx-1.5">·</span>
                      {new Date(sub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>

                    {/* Content preview */}
                    {sub.content && (
                      <div className="mt-2 text-sm text-[var(--color-muted)] line-clamp-3 whitespace-pre-wrap leading-relaxed bg-[var(--color-background)] rounded-xl py-3 px-4 border border-[var(--color-border)]/50 font-serif">
                        {sub.content}
                      </div>
                    )}
                  </div>

                  {/* Actions — only for pending */}
                  {sub.status === 'pending' && (
                    <div className="flex flex-wrap sm:flex-col gap-2 flex-shrink-0 border-t sm:border-t-0 border-[var(--color-border)] pt-4 sm:pt-0 w-full sm:w-auto">
                      <form action={convertAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id"      value={sub.id} />
                        <input type="hidden" name="title"   value={sub.title} />
                        <input type="hidden" name="content" value={sub.content ?? ''} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="w-full text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Convert to Draft
                        </Button>
                      </form>
                      <form action={rejectAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id" value={sub.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="w-full text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
