import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PenLine, LogIn, CheckCircle, Clock, XCircle, ExternalLink, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import PageContainer from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'Write | Sathyadhare',
  description: 'Submit your article to the Sathyadhare editorial team.',
};

export const dynamic = 'force-dynamic';

/* ── Status metadata ─────────────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending Review', color: '#f59e0b', icon: Clock        },
  approved:  { label: 'Published',      color: '#10b981', icon: CheckCircle  },
  published: { label: 'Published',      color: '#10b981', icon: CheckCircle  },
  rejected:  { label: 'Not Selected',   color: '#ef4444', icon: XCircle      },
};

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Search params ─────────────────────────────────────────────────────── */
interface Props {
  searchParams: Promise<{ submitted?: string }>;
}

export default async function WritePage({ searchParams }: Props) {
  const { submitted } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  /* ── Guest: sign-in gate ─────────────────────────────────────────────── */
  if (!user) {
    return (
      <PageContainer className="min-h-[100svh] py-8 pb-[calc(var(--bottom-nav-height)+1rem)]">
        <div className="pt-3 pb-5 border-b border-[var(--color-border)] mb-6">
          <h1 className="text-[26px] font-black text-[var(--color-text)] tracking-tight">Write</h1>
          <p className="text-[14px] text-[var(--color-muted)] mt-1">Submit your article for review</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="w-16 h-16 rounded-2xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] mb-5">
            <PenLine size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-[18px] font-bold text-[var(--color-text)] mb-2">Sign in to contribute</h2>
          <p className="text-[13px] text-[var(--color-muted)] leading-relaxed mb-7 max-w-xs">
            Create an account or sign in to submit your article to the Sathyadhare editorial team.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[240px]">
            <Link
              href="/sign-in?return_to=/write"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-[13px] uppercase tracking-wider active:scale-95 transition-all"
            >
              <LogIn size={16} /> Sign In
            </Link>
            <Link
              href="/signup?redirect=/write"
              className="flex items-center justify-center w-full py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-bold text-[13px] uppercase tracking-wider active:scale-95 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ── Fetch profile ─────────────────────────────────────────────────────── */
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Reader';
  const userEmail   = profile?.email || user.email || '';

  /* ── Server action to submit ─────────────────────────────────────────── */
  async function submitAction(formData: FormData) {
    'use server';
    const sb   = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) return;

    const name    = formData.get('name')    as string;
    const email   = formData.get('email')   as string;
    const title   = formData.get('title')   as string;
    const content = formData.get('content') as string;

    await sb.from('guest_submissions').insert({
      name,
      email,
      title,
      content,
      status:  'pending',
      user_id: u.id,          // link to signed-in reader account
    });

    redirect('/write?submitted=true');
  }

  /* ── Submission success screen ─────────────────────────────────────────── */
  if (submitted === 'true') {
    return (
      <PageContainer className="min-h-[100svh] py-8 pb-[calc(var(--bottom-nav-height)+1rem)] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-[22px] font-bold text-[var(--color-text)] mb-2 tracking-tight">Thank you!</h1>
        <p className="text-[14px] text-[var(--color-muted)] mb-8 max-w-xs leading-relaxed">
          Your submission is received. Our editors will review it and get back to you.
        </p>
        <div className="flex gap-3">
          <Link
            href="/write"
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            View My Submissions
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-[13px] font-bold active:scale-95 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </PageContainer>
    );
  }

  /* ── Fetch past submissions for tracker ────────────────────────────────── */
  // Try with user_id first; fall back to email match if column doesn't exist yet
  let submissions: any[] = [];
  try {
    const { data: byUserId } = await supabase
      .from('guest_submissions')
      .select('id, title, status, created_at, rejection_reason, published_slug')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (byUserId && byUserId.length > 0) {
      submissions = byUserId;
    } else if (userEmail) {
      // Fallback: match by email for submissions before user_id column existed
      const { data: byEmail } = await supabase
        .from('guest_submissions')
        .select('id, title, status, created_at, rejection_reason, published_slug')
        .eq('email', userEmail)
        .order('created_at', { ascending: false });
      submissions = byEmail ?? [];
    }
  } catch {
    // If user_id column doesn't exist yet, gracefully show empty tracker
    submissions = [];
  }

  return (
    <PageContainer className="py-8 pb-[calc(var(--bottom-nav-height)+1rem)] flex flex-col gap-6">

      {/* Page title */}
      <div className="pt-2 border-b border-[var(--color-border)] pb-4">
        <h1 className="text-[26px] font-black text-[var(--color-text)] tracking-tight">Write</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Submit your article for editorial review</p>
      </div>

      {/* ── Submission Form ──────────────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] min-w-[44px] min-h-[44px]">
            <PenLine size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--color-text)] leading-tight">New Submission</p>
            <p className="text-[11px] text-[var(--color-muted)]">Submitting as {displayName}</p>
          </div>
        </div>

        <form action={submitAction} className="flex flex-col gap-4 p-5">

          {/* Hidden pre-fill — name + email from profile */}
          <input type="hidden" name="name"  value={displayName} />
          <input type="hidden" name="email" value={userEmail} />

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Article Title
            </label>
            <input
              name="title" required type="text" placeholder="A compelling title…"
              className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[14px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-muted)] placeholder:font-normal"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Article Content
            </label>
            <textarea
              name="content" required rows={12}
              placeholder="Write your article here. You can use plain text — our editors will format it for publication."
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed placeholder:text-[var(--color-muted)] placeholder:font-normal"
            />
          </div>

          {/* Editorial note */}
          <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
            By submitting you agree your article may be edited for clarity and style.
            We will notify you once reviewed.
          </p>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-12 bg-[var(--color-primary)] text-white font-bold text-[13px] uppercase tracking-wider rounded-xl active:scale-95 transition-all"
          >
            Submit Article
          </button>
        </form>
      </div>

      {/* ── Submission Tracker ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
            My Submissions
          </p>
          {submissions.length > 0 && (
            <span className="text-[12px] font-bold text-[var(--color-muted)]">{submissions.length}</span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center bg-[var(--color-surface)] rounded-2xl border border-dashed border-[var(--color-border)]">
            <PenLine size={24} className="text-[var(--color-muted)] opacity-40" />
            <p className="text-[13px] font-bold text-[var(--color-text)]">No submissions yet</p>
            <p className="text-[12px] text-[var(--color-muted)]">Your past submissions will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {submissions.map((s) => {
              const statusKey = (s.status ?? 'pending').toLowerCase();
              const meta = STATUS_META[statusKey] ?? STATUS_META.pending;
              const Icon = meta.icon;
              const isPublished = (statusKey === 'approved' || statusKey === 'published') && s.published_slug;
              const isRejected  = statusKey === 'rejected';

              return (
                <div
                  key={s.id}
                  className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden"
                >
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-4 py-4">
                    {/* Status icon */}
                    <div
                      className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px]"
                      style={{ background: `${meta.color}14`, color: meta.color }}
                    >
                      <Icon size={17} strokeWidth={2} />
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[var(--color-text)] truncate leading-tight">{s.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-black uppercase tracking-wider"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">· {relTime(s.created_at)}</span>
                      </div>
                    </div>

                    {/* Link to published article */}
                    {isPublished && (
                      <Link
                        href={`/articles/${s.published_slug}`}
                        className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-[12px] font-bold"
                        target="_blank"
                      >
                        <ExternalLink size={13} strokeWidth={2} />
                        Read
                      </Link>
                    )}

                    {!isPublished && !isRejected && (
                      <ChevronRight size={15} className="text-[var(--color-muted)] shrink-0" />
                    )}
                  </div>

                  {/* Rejection reason — shown as a callout below the row */}
                  {isRejected && s.rejection_reason && (
                    <div className="px-4 pb-4">
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                        <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-0.5">
                            Editor&apos;s note:
                          </p>
                          <p className="text-[12px] text-[var(--color-muted)] leading-relaxed">
                            {s.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
