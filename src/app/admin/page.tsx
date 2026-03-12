import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Users, FileText, MessageSquare,
  Settings, TrendingUp, Layers,
  Tag, Image as ImageIcon, CheckCircle,
  Send, Bell, Library, ChevronRight
} from 'lucide-react';
import ReaderModeSwitch from '@/components/ReaderModeSwitch';
import { 
  PresenceWrapper, 
  PresenceHeader, 
  PresenceCard, 
  PresenceStatCircle, 
  PresenceActionTile, 
  PresenceButton, 
  PresenceSectionHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';


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
    weeklyActivity: [] as { day: string, active: boolean }[],
  };

  try {
    const results = await Promise.allSettled([
      /* 0 */ supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      /* 1 */ supabase.from('comments').select('*', { count: 'exact', head: true }),
      /* 2 */ supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      /* 3 */ supabase.from('profiles').select('*', { count: 'exact', head: true }),
      /* 4 */ supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      /* 5 */ supabase.from('articles').select('id, title, status, created_at, author:profiles!author_id(full_name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
      /* 6 */ supabase.from('guest_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Fast 7-day view aggregates directly mapped
    try {
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
    } catch (chartErr) {
      console.error('Dashboard chart fetch error:', chartErr);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value : null;
    metrics.totalArticles      = g(0)?.count  ?? 0;
    metrics.totalComments      = g(1)?.count  ?? 0;
    metrics.pendingComments    = g(2)?.count  ?? 0;
    metrics.totalUsers         = g(3)?.count  ?? 0;
    metrics.newUsers7d         = g(4)?.count  ?? 0;
    metrics.recentArticles     = g(5)?.data  || [];
    metrics.pendingSubmissions = g(6)?.count ?? 0;

    // HIGH-01: Compute weekly dots from actual publish data
    // Get all articles published in the last 7 days
    const { data: weeklyArticles } = await supabase
      .from('articles')
      .select('published_at')
      .eq('status', 'published')
      .gte('published_at', sevenDaysAgo.toISOString());

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    metrics.weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const hasPublished = weeklyArticles?.some(a => {
        const pad = new Date(a.published_at);
        return pad.toDateString() === d.toDateString();
      });
      return { day: days[d.getDay()], active: !!hasPublished };
    });
  } catch (e) { console.error('Admin dashboard fetch error:', e); }

  /* ════════════════════════════════════════════════════════════════
     PRESENCE DASHBOARD IMPLEMENTATION
  ════════════════════════════════════════════════════════════════ */
  const roleLabel = isSuperAdmin ? 'Super Admin · Full Access' : 'Admin · Content Manager';

  return (
    <PresenceWrapper>
      {/* ── Presence Header ── */}
      <PresenceHeader 
        title="Super Admin"
        roleLabel={roleLabel}
        initials={initials}
        icon1={Send}
        icon2={Bell}
        icon1Href="/admin/submissions"
        icon2Href="/admin/audit-logs"
        icon1Badge={metrics.pendingSubmissions > 0}
        icon2Badge={metrics.pendingComments > 0}
      />

      <div className="p-4 flex flex-col gap-4 relative z-20">
        {/* ── Attendance/Quick Info Card ── */}
        <PresenceCard className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-zinc-500">
              <Plus className="w-6 h-6" strokeWidth={1.25} />
            </div>
            <p className="font-bold text-zinc-600 dark:text-zinc-400">Quick Create Article</p>
          </div>
          <Link href="/admin/articles/new">
            <PresenceButton>Submit</PresenceButton>
          </Link>
        </PresenceCard>

        {/* ── Today's Status Card ── */}
        <PresenceCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50">
                {new Date().getDate()}
                <Library className="inline-block w-4 h-4 ml-1 mb-6 text-indigo-300" strokeWidth={1.25} />
              </span>
              <div>
                <p className="text-lg font-black leading-none">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <Link href="/admin/articles" className="w-10 h-10 rounded-full border border-zinc-100 dark:border-white/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-50 transition-colors">
              <ChevronRight className="w-5 h-5" strokeWidth={1.25} />
            </Link>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Platform Overview</p>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {metrics.weeklyActivity.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-zinc-500">{d.day}</span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${d.active ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-gray-700'}`}>
                    {d.active ? <CheckCircle className="w-4 h-4" strokeWidth={1.25} /> : <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PresenceCard>

        {/* ── Real-time Analytics Row ── */}
        <div className="grid grid-cols-3 gap-3">
          <PresenceCard className="flex flex-col items-center p-4">
            <PresenceStatCircle 
              percent={Math.min(100, (metrics.totalArticles / 50) * 100)} 
              value={metrics.totalArticles} 
              label="Articles" 
            />
          </PresenceCard>
          <PresenceCard className="flex flex-col items-center p-4">
            <PresenceStatCircle 
              percent={Math.min(100, (metrics.totalComments / 100) * 100)} 
              value={metrics.totalComments} 
              label="Comments" 
              color="#fbbf24" 
            />
          </PresenceCard>
          <PresenceCard className="flex flex-col items-center p-4">
            <PresenceStatCircle 
              percent={Math.min(100, (metrics.totalUsers / 20) * 100)} 
              value={metrics.totalUsers > 1000 ? (metrics.totalUsers / 1000).toFixed(1) + 'k' : metrics.totalUsers} 
              label="Users" 
              color="#34d399" 
            />
          </PresenceCard>
        </div>

        {/* ── Main Action Grid ── */}
        <PresenceCard className="grid grid-cols-3 gap-y-4 gap-x-2">
          <PresenceActionTile href="/admin/articles" icon={FileText} label="Articles" />
          <PresenceActionTile href="/admin/users" icon={Users} label="Users" badge={metrics.newUsers7d > 0} />
          <PresenceActionTile href="/admin/comments" icon={MessageSquare} label="Comments" badge={metrics.pendingComments > 0} />
          <PresenceActionTile href="/admin/analytics" icon={TrendingUp} label="Analytics" />
          <PresenceActionTile href="/admin/categories" icon={Tag} label="Categories" />
          <PresenceActionTile href="/admin/media" icon={ImageIcon} label="Media" />
          <PresenceActionTile href="/admin/sequels" icon={Layers} label="Sequels" />
          <PresenceActionTile href="/admin/submissions" icon={Send} label="Submissions" badge={metrics.pendingSubmissions > 0} />
          <PresenceActionTile href="/admin/settings" icon={Settings} label="Settings" />
        </PresenceCard>

        {/* ── Floating Reader Mode Switch ── */}
        <div className="pt-4">
          <ReaderModeSwitch role={profile?.role as 'super_admin' | 'admin' | 'editor' | 'reader'} />
        </div>

        {/* ── Recent Articles Section ── */}
        <div className="pt-4">
          <PresenceSectionHeader title="Recent Activity" action="See All" actionHref="/admin/audit-logs" />
          <div className="flex flex-col gap-3">
            {metrics.recentArticles.map((a) => (
              <Link key={a.id} href={`/admin/articles/${a.id}/edit`}>
                <PresenceCard className="flex items-center justify-between py-3 px-4 active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50 shrink-0">
                      <FileText className="w-5 h-5" strokeWidth={1.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{a.title}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{(a.status || 'draft').replace('_', ' ')} · {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" strokeWidth={1.25} />
                </PresenceCard>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PresenceWrapper>
  );
}
