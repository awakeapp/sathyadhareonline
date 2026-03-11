import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ReaderModeSwitch from '@/components/ReaderModeSwitch';
import {
  Plus, Users, FileText, MessageSquare,
  ScrollText, Settings, Shield, IndianRupee, SquarePen, LucideIcon,
  LayoutDashboard, TrendingUp, Activity, BookOpen, Layers,
  Tag, Image as ImageIcon, AlertCircle, CheckCircle,
  ArrowUp, ArrowRight, Sparkles, UserPlus, Send
} from 'lucide-react';
import { StatsChart } from './StatsChart';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────────────── */
const statusColor = (s: string) => {
  if (s === 'published')  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'in_review')  return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (s === 'archived')   return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
};

/* ─── Metric card ─── */
function MetricCard({
  label, value, delta, deltaLabel, icon: Icon, color, href, accent,
}: {
  label: string; value: string | number; delta?: number; deltaLabel?: string;
  icon: LucideIcon; color: string; accent: string; href?: string;
}) {
  const inner = (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 h-full transition-all hover:border-opacity-100 group">
      {/* Glow blob */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${color}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${color} shadow-lg`}>
            <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </div>
          {delta !== undefined && delta > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              <ArrowUp style={{ width: 10, height: 10 }} />
              {delta}
            </span>
          )}
        </div>
        <p className="text-[28px] font-black tracking-tighter leading-none mb-1" style={{ color: accent }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">{label}</p>
        {deltaLabel && <p className="text-[10px] font-semibold text-[var(--color-muted)] mt-0.5 opacity-70">{deltaLabel}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full outline-none">{inner}</Link> : <div className="h-full">{inner}</div>;
}

/* ─── Quick action tile ─── */
function ActionTile({ href, label, icon: Icon, color, badge }: {
  href: string; label: string; icon: LucideIcon; color: string; badge?: string;
}) {
  return (
    <Link href={href} className="group outline-none relative">
      {badge && (
        <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5">
          {badge}
        </span>
      )}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col items-center gap-2.5 transition-all hover:scale-[1.04] active:scale-95 hover:border-opacity-100 group-hover:shadow-lg">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white ${color} shadow-md group-hover:shadow-xl transition-shadow`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-center leading-tight text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors">{label}</span>
      </div>
    </Link>
  );
}

/* ─── Section header ─── */
function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-bold text-[#a78bfa] hover:underline">
          {linkLabel} <ArrowRight style={{ width: 12, height: 12 }} />
        </Link>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let profile: { full_name: string | null; role: string } | null = null;
  try {
    const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
    profile = p;
  } catch { /* ignore */ }

  const role = profile?.role;
  if (!role || (role !== 'super_admin' && role !== 'admin')) redirect('/');

  const isSuperAdmin = role === 'super_admin';
  const firstName = (profile?.full_name || user.email || 'Admin').split(' ')[0];
  const initials  = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();

  /* ── Shared data fetches ── */
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

  const metrics = {
    totalArticles: 0, publishedToday: 0, draftArticles: 0,
    totalViews: 0, totalCategories: 0,
    totalComments: 0, pendingComments: 0,
    totalUsers: 0, newUsers7d: 0, newUsers30d: 0,
    totalViews30d: 0, pendingSubmissions: 0,
    lastAudit: null as { action: string; created_at: string } | null,
    recentArticles: [] as { id: string; title: string; status: string; created_at: string; author?: { full_name: string } }[],
    recentUsers: [] as { id: string; avatar_url?: string; full_name?: string; email?: string; role?: string; created_at?: string }[],
    recentComments: [] as { id: string; content: string; created_at: string; profiles?: { full_name: string; avatar_url: string }; articles?: { title: string } }[],
    chartData: [] as { date: string; views: number }[],
    systemHealth: 'online' as 'online' | 'degraded',
  };

  try {
    const results = await Promise.allSettled([
      /* 0 */ supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      /* 1 */ supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', startOfToday.toISOString()),
      /* 2 */ supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      /* 3 */ supabase.from('article_views').select('*', { count: 'exact', head: true }),
      /* 4 */ supabase.from('categories').select('*', { count: 'exact', head: true }),
      /* 5 */ supabase.from('comments').select('*', { count: 'exact', head: true }),
      /* 6 */ supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      /* 7 */ supabase.from('profiles').select('*', { count: 'exact', head: true }),
      /* 8 */ supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      /* 9 */ supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
      /* 10 */ supabase.from('audit_logs').select('action, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      /* 11 */ supabase.from('articles').select('id, title, status, created_at, author:profiles!author_id(full_name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
      /* 12 */ supabase.from('profiles').select('id, full_name, email, avatar_url, role, created_at').order('created_at', { ascending: false }).limit(4),
      /* 13 */ supabase.from('guest_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      /* 14 */ supabase.from('article_views').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
      /* 15 */ supabase.from('comments').select('id, content, created_at, profiles(full_name, avatar_url), articles(title)').order('created_at', { ascending: false }).limit(4),
    ]);

    // Fast 7-day view aggregates directly mapped
    const last7DaysData = await Promise.all(
      Array.from({ length: 7 }).map(async (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        const start = new Date(d); start.setHours(0,0,0,0);
        const end = new Date(d); end.setHours(23,59,59,999);
        const { count } = await supabase.from('article_views').select('*', { count: 'exact', head: true }).gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
        return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), views: count || 0 };
      })
    );
    metrics.chartData = last7DaysData.reverse();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value : null;
    metrics.totalArticles      = g(0)?.count  ?? 0;
    metrics.publishedToday     = g(1)?.count  ?? 0;
    metrics.draftArticles      = g(2)?.count  ?? 0;
    metrics.totalViews         = g(3)?.count  ?? 0;
    metrics.totalCategories    = g(4)?.count  ?? 0;
    metrics.totalComments      = g(5)?.count  ?? 0;
    metrics.pendingComments    = g(6)?.count  ?? 0;
    metrics.totalUsers         = g(7)?.count  ?? 0;
    metrics.newUsers7d         = g(8)?.count  ?? 0;
    metrics.newUsers30d        = g(9)?.count  ?? 0;
    metrics.lastAudit          = g(10)?.data  || null;
    metrics.recentArticles     = g(11)?.data  || [];
    metrics.recentUsers        = g(12)?.data  || [];
    metrics.pendingSubmissions = g(13)?.count ?? 0;
    metrics.totalViews30d      = g(14)?.count ?? 0;
    metrics.recentComments     = g(15)?.data  || [];
  } catch (e) { console.error('Admin dashboard fetch error:', e); }

  /* ════════════════════════════════════════════════════════════════
     SUPER ADMIN DASHBOARD
  ════════════════════════════════════════════════════════════════ */
  if (isSuperAdmin) {
    const ACCENT = '#7c3aed';
    const LIGHT  = '#a78bfa';

    return (
      <div className="font-sans antialiased max-w-5xl mx-auto px-1 py-2 pb-28">

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <header className="relative overflow-hidden rounded-[2rem] border border-[#7c3aed]/20 bg-gradient-to-br from-[#7c3aed]/10 via-[var(--color-surface)] to-[var(--color-surface)] px-6 py-6 mb-6 mt-2">
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 mb-3">
                <Shield className="w-3 h-3 text-[#a78bfa]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a78bfa]">Super Admin · Full Access</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {profile?.full_name ? `Welcome back, ${firstName} 👋` : 'Command Center'}
              </h1>
              <p className="text-xs text-[var(--color-muted)] mt-1.5 font-semibold">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button asChild size="icon" className="rounded-2xl h-10 w-10 shadow-lg shadow-[#7c3aed]/30" style={{ background: ACCENT }}>
                <Link href="/admin/articles/new"><Plus className="w-5 h-5" /></Link>
              </Button>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#7c3aed]/30" style={{ background: ACCENT }}>
                {initials}
              </div>
            </div>
          </div>

          {/* System status bar */}
          <div className="relative z-10 flex items-center gap-3 mt-5 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              All Systems Online
            </span>
            <span className="text-[var(--color-border)]">·</span>
            <span className="text-[10px] font-bold text-[var(--color-muted)]">{metrics.totalUsers.toLocaleString()} Users</span>
            <span className="text-[var(--color-border)]">·</span>
            <span className="text-[10px] font-bold text-[var(--color-muted)]">{metrics.totalArticles} Articles</span>
            <span className="text-[var(--color-border)]">·</span>
            <span className="text-[10px] font-bold text-[var(--color-muted)]">{metrics.totalViews.toLocaleString()} Views</span>
          </div>
        </header>

        {/* ── Reader Mode Switch ─────────────────────────────────── */}
        <ReaderModeSwitch role="super_admin" />

        {/* ── Platform Overview: 4 top metrics ──────────────────── */}
        <SectionHeader title="Platform Overview" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Total Users"    value={metrics.totalUsers}    delta={metrics.newUsers7d}   deltaLabel={`+${metrics.newUsers30d} this month`} icon={Users}        color="bg-violet-600"  accent={LIGHT}   href="/admin/users" />
          <MetricCard label="Articles"       value={metrics.totalArticles}  delta={metrics.publishedToday} deltaLabel={`${metrics.draftArticles} drafts`} icon={FileText}     color="bg-blue-600"    accent="#60a5fa"  href="/admin/articles" />
          <MetricCard label="Total Views"    value={metrics.totalViews.toLocaleString()} deltaLabel={`+${metrics.totalViews30d.toLocaleString()} last 30 days`} icon={TrendingUp}   color="bg-indigo-600"  accent="#818cf8" href="/admin/analytics" />
          <MetricCard label="Comments"       value={metrics.totalComments}  delta={metrics.pendingComments} deltaLabel={metrics.pendingComments > 0 ? `${metrics.pendingComments} pending review` : 'all approved'} icon={MessageSquare} color="bg-emerald-600" accent="#34d399" href="/admin/comments" />
        </div>

        {/* ── Quick Actions / System Controls ──────────────── */}
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8">
          <ActionTile href="/admin/articles/new"   label="Create Article"  icon={SquarePen}     color="bg-blue-600" />
          <ActionTile href="/admin/users?invite=true" label="Invite User" icon={UserPlus}       color="bg-violet-600" />
          <ActionTile href="/admin/analytics"      label="View Analytics"  icon={Activity}      color="bg-indigo-600" />
          <ActionTile href="/admin/comments"       label="Manage Comments" icon={MessageSquare} color="bg-emerald-600" badge={metrics.pendingComments > 0 ? String(metrics.pendingComments) : undefined} />
          <ActionTile href="/admin/submissions"    label="Submissions"     icon={Send}          color="bg-amber-600" badge={metrics.pendingSubmissions > 0 ? String(metrics.pendingSubmissions) : undefined} />
        </div>

        {/* ── Content Management ────────────────────────────────── */}
        <SectionHeader title="Content Management" />
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8">
          <ActionTile href="/admin/articles"     label="All Articles"   icon={FileText}   color="bg-blue-500" />
          <ActionTile href="/admin/categories"   label="Categories"     icon={Tag}        color="bg-indigo-500" />
          <ActionTile href="/admin/media"        label="Media"          icon={ImageIcon}  color="bg-sky-600" />
          <ActionTile href="/admin/sequels"      label="Sequels"        icon={Layers}     color="bg-cyan-600" />
          <ActionTile href="/admin/settings"     label="Settings"       icon={Settings}   color="bg-gray-600" />
        </div>

        {/* ── 3-column cards: recent articles, recent users, stats ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Recent articles */}
          <section className="lg:col-span-2">
            <SectionHeader title="Recent Articles" href="/admin/articles" linkLabel="View all" />
            <div className="space-y-2">
              {metrics.recentArticles.map((a) => (
                <Link key={a.id} href={`/admin/articles/${a.id}/edit`} className="block group outline-none">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-1.5 px-4 py-3 hover:border-[#7c3aed]/40 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                          background: a.status === 'published' ? '#34d399' : a.status === 'in_review' ? '#fbbf24' : '#60a5fa'
                        }} />
                        <span className="flex-1 text-sm font-bold truncate group-hover:text-[#a78bfa] transition-colors">{a.title}</span>
                      </div>
                      <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(a.status || 'draft')}`}>
                        {(a.status || 'draft').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium pl-3.5">
                      <span>{a.author?.full_name || 'Unknown Author'}</span>
                      <span>·</span>
                      <span>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {metrics.recentArticles.length === 0 && (
                <div className="text-center py-10 text-[var(--color-muted)] text-sm font-semibold rounded-2xl border border-dashed border-[var(--color-border)]">
                  No articles yet — <Link href="/admin/articles/new" className="text-[#a78bfa] hover:underline">create the first one</Link>
                </div>
              )}
            </div>

            {/* Daily Views Line Chart */}
            <div className="mt-8">
              <SectionHeader title="7-Day Views Overview" href="/admin/analytics" linkLabel="Full report" />
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <StatsChart data={metrics.chartData} />
              </div>
            </div>
          </section>

          {/* Side panel: users + pending */}
          <section className="space-y-6">
            {/* Recent users */}
            <div>
              <SectionHeader title="New Users" href="/admin/users" linkLabel="Manage" />
              <div className="space-y-2">
                {metrics.recentUsers.map((u) => (
                  <Link key={u.id} href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#7c3aed]/40 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center text-violet-300 font-black text-sm overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.full_name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate group-hover:text-[#a78bfa] transition-colors">{u.email || u.full_name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] text-[var(--color-muted)] font-semibold truncate">{u.role?.replace('_', ' ') || 'reader'}</p>
                        <p className="text-[9px] text-[var(--color-muted)] font-medium whitespace-nowrap opacity-60">
                          {u.created_at && new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {metrics.recentUsers.length === 0 && (
                  <div className="py-6 text-center text-xs text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">No users yet</div>
                )}
              </div>
            </div>

            {/* Recent comments */}
            <div>
              <SectionHeader title="Recent Comments" href="/admin/comments" linkLabel="Manage" />
              <div className="space-y-2">
                {metrics.recentComments.map((c) => (
                  <Link key={c.id} href="/admin/comments" className="block group outline-none">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[#7c3aed]/40 transition-all hover:shadow-md">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-[var(--color-border)] flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-[#7c3aed]/20 text-violet-400 font-bold flex items-center justify-center text-[10px]">{c.profiles?.full_name?.charAt(0) || '?'}</div>}
                        </div>
                        <p className="text-xs font-bold text-[var(--color-text)] truncate">{c.profiles?.full_name || 'Anonymous'}</p>
                        <span className="text-[10px] text-[var(--color-muted)] ml-auto shrink-0">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-xs font-serif text-[var(--color-muted)] line-clamp-2 leading-relaxed italic group-hover:text-[var(--color-text)] transition-colors">
                        &quot;{c.content}&quot;
                      </p>
                      <p className="text-[9px] font-bold text-violet-400/80 uppercase tracking-widest mt-2 truncate max-w-full">
                        ON {c.articles?.title || 'Unknown Article'}
                      </p>
                    </div>
                  </Link>
                ))}
                {metrics.recentComments.length === 0 && (
                   <div className="py-6 text-center text-xs text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">No recent comments</div>
                )}
              </div>
            </div>

            {/* Pending comments callout */}
            {metrics.pendingComments > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-amber-400">{metrics.pendingComments} Pending</p>
                    <p className="text-[10px] font-bold text-[var(--color-muted)]">Comments need review</p>
                  </div>
                </div>
                <Button asChild size="sm" className="w-full rounded-xl text-xs" style={{ background: '#f59e0b', color: '#000' }}>
                  <Link href="/admin/comments">Review Now</Link>
                </Button>
              </div>
            )}

            {metrics.pendingComments === 0 && metrics.totalComments > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-400">All Clear</p>
                  <p className="text-[10px] font-bold text-[var(--color-muted)]">All comments approved</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Audit & Security strip ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Link href="/admin/audit-logs" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 flex items-center gap-4 hover:border-[#7c3aed]/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-black group-hover:text-[#a78bfa] transition-colors">Audit Logs</p>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold">
                {metrics.lastAudit
                  ? `Last: ${metrics.lastAudit.action.replace(/_/g, ' ')}`
                  : 'No recent activity'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-muted)] ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/admin/security" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 flex items-center gap-4 hover:border-rose-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-black group-hover:text-rose-400 transition-colors">Security</p>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold">API keys, login history</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-muted)] ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/admin/settings" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 flex items-center gap-4 hover:border-gray-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-gray-600/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-black group-hover:text-[var(--color-text)] transition-colors">Settings</p>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold">Site config, branding</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-muted)] ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── Financial & Newsletter quick access ───────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link href="/admin/financial" className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex items-center gap-4 hover:bg-emerald-500/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-400">Financial Overview</p>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold">Revenue, subscriptions, refunds</p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/admin/analytics" className="group rounded-2xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 px-5 py-4 flex items-center gap-4 hover:bg-[#7c3aed]/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-violet-400">Analytics Dashboard</p>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold">Traffic, growth, engagement</p>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     REGULAR ADMIN DASHBOARD
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="font-sans antialiased max-w-5xl mx-auto px-1 py-2 pb-28">

      {/* Header */}
      <header className="relative overflow-hidden rounded-[2rem] border border-[#0047ff]/20 bg-[var(--color-surface)] px-6 py-6 mb-6 mt-2">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#0047ff]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0047ff]/15 border border-[#0047ff]/30 mb-3">
              <LayoutDashboard className="w-3 h-3 text-[#4f8ef7]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#4f8ef7]">Admin · Content Manager</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {profile?.full_name ? `Hi, ${firstName} 👋` : 'Content Dashboard'}
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-1 font-semibold">Content management · Admin Panel</p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Button asChild size="icon" className="rounded-2xl h-10 w-10 shadow-md shadow-[#0047ff]/30" style={{ background: '#0047ff' }}>
              <Link href="/admin/articles/new"><Plus className="w-5 h-5" /></Link>
            </Button>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md shadow-[#0047ff]/30" style={{ background: '#0047ff' }}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      <ReaderModeSwitch role="admin" />

      <SectionHeader title="Content Statistics" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Articles"    value={metrics.totalArticles}    delta={metrics.publishedToday}   deltaLabel={`${metrics.draftArticles} drafts`} icon={FileText}      color="bg-blue-600"    accent="#60a5fa" href="/admin/articles" />
        <MetricCard label="Total Views" value={metrics.totalViews.toLocaleString()} deltaLabel="all time"                                                              icon={TrendingUp}    color="bg-indigo-500"  accent="#818cf8" />
        <MetricCard label="Comments"    value={metrics.totalComments}    delta={metrics.pendingComments}  deltaLabel={`${metrics.pendingComments} pending`}             icon={MessageSquare} color="bg-emerald-600" accent="#34d399" href="/admin/comments" />
        <MetricCard label="Categories"  value={metrics.totalCategories}  deltaLabel="topic groups"                                                                     icon={Tag}           color="bg-amber-600"   accent="#fbbf24" href="/admin/categories" />
      </div>

      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
        <ActionTile href="/admin/articles/new"  label="Write"       icon={SquarePen}     color="bg-blue-600" />
        <ActionTile href="/admin/articles"      label="Articles"    icon={FileText}      color="bg-blue-500" />
        <ActionTile href="/admin/categories"    label="Categories"  icon={Tag}           color="bg-indigo-500" />
        <ActionTile href="/admin/sequels"        label="Sequels"      icon={BookOpen}      color="bg-sky-600" />
        <ActionTile href="/admin/comments"      label="Comments"    icon={MessageSquare} color="bg-amber-500" badge={metrics.pendingComments > 0 ? String(metrics.pendingComments) : undefined} />
        <ActionTile href="/admin/media"         label="Media"       icon={ImageIcon}     color="bg-teal-600" />
      </div>

      {/* Recent articles + comment queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section>
          <SectionHeader title="Recent Articles" href="/admin/articles" linkLabel="View all" />
          <div className="space-y-2">
            {metrics.recentArticles.slice(0, 5).map((a) => (
              <Link key={a.id} href={`/admin/articles/${a.id}/edit`} className="block group outline-none">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3 px-4 py-3 hover:border-[#0047ff]/30 transition-all">
                  <span className="flex-1 text-sm font-bold truncate group-hover:text-[#4f8ef7] transition-colors">{a.title}</span>
                  <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(a.status || 'draft')}`}>
                    {(a.status || 'draft').replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
            {metrics.recentArticles.length === 0 && (
              <div className="text-center py-10 text-[var(--color-muted)] text-sm font-semibold rounded-2xl border border-dashed border-[var(--color-border)]">No articles yet</div>
            )}
          </div>
        </section>

        <section>
          <SectionHeader title="Comment Queue" href="/admin/comments" linkLabel="Review" />
          <Card className="rounded-3xl border-[var(--color-border)]">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${metrics.pendingComments > 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter">{metrics.pendingComments}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mt-1">
                  {metrics.pendingComments > 0 ? 'Comments Need Review' : 'All Comments Approved'}
                </p>
              </div>
              {metrics.pendingComments > 0 && (
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/admin/comments">Review Now</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

    </div>
  );
}
