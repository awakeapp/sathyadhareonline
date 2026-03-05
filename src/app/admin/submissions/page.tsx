import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Guest Submissions</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {pendingCount} pending · {(submissions?.length ?? 0)} total
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30">
              {pendingCount}
            </span>
          )}
        </div>

        {/* ── List ────────────────────────────────────────────────── */}
        {!submissions || submissions.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
            <p className="font-semibold text-white mb-1">No submissions yet</p>
            <p className="text-sm">Reader-submitted articles will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-lg transition-all ${
                  sub.status !== 'pending' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Title + status badge */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-base font-bold text-white truncate">{sub.title}</h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyles[sub.status] ?? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {sub.status}
                      </span>
                    </div>
                    {/* Author info */}
                    <p className="text-sm text-[var(--color-muted)]">
                      By <span className="font-semibold text-white">{sub.name}</span>
                      {' · '}
                      <a href={`mailto:${sub.email}`} className="text-[#4f8ef7] hover:underline">{sub.email}</a>
                      {' · '}
                      {new Date(sub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    {/* Content preview */}
                    {sub.content && (
                      <p className="mt-3 text-sm text-[var(--color-muted)] line-clamp-3 whitespace-pre-wrap">
                        {sub.content}
                      </p>
                    )}
                  </div>

                  {/* Actions — only for pending */}
                  {sub.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <form action={convertAction}>
                        <input type="hidden" name="id"      value={sub.id} />
                        <input type="hidden" name="title"   value={sub.title} />
                        <input type="hidden" name="content" value={sub.content ?? ''} />
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold tracking-wide text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-colors uppercase"
                        >
                          ✓ Convert to Draft
                        </button>
                      </form>
                      <form action={rejectAction}>
                        <input type="hidden" name="id" value={sub.id} />
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold tracking-wide text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors uppercase"
                        >
                          ✕ Reject
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
