import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, MessageSquare,
  CheckCircle,
  Send, Bell, ChevronRight
} from 'lucide-react';
import ReaderModeSwitch from '@/components/ReaderModeSwitch';
import { 
  PresenceWrapper, 
  PresenceHeader, 
  PresenceCard,
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

  /* ── Data fetches for Meta Dashboard Analytics ── */
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const nowStr = new Date().toISOString();

  const metrics = {
    totalArticles: 0,
    monthlyReaders: 0,
    activeAuthors: 0,
    communityEngagement: 0,
    pendingSubmissions: 0,
    pendingComments: 0,
    scheduledArticles: 0,
    recentActivity: [] as { id: string; type: string; title: string; user?: string; ts: string; href: string }[]
  };

  try {
    const results = await Promise.allSettled([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('article_views').select('*', { count: 'exact', head: true }).gte('viewed_at', thirtyDaysAgo.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'editor', 'super_admin']),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('guest_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('published_at', nowStr),
      // Activity queries
      supabase.from('articles').select('id, title, status, created_at, author:profiles!author_id(full_name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(3),
      supabase.from('guest_submissions').select('id, name, title, created_at').order('created_at', { ascending: false }).limit(3),
      supabase.from('comments').select('id, content, created_at, guest_name, profiles!user_id(full_name)').order('created_at', { ascending: false }).limit(3),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gC = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value?.count ?? 0 : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gD = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value?.data ?? [] : [];

    metrics.totalArticles = gC(0);
    metrics.monthlyReaders = gC(1);
    metrics.activeAuthors = gC(2);
    metrics.communityEngagement = gC(3);
    metrics.pendingSubmissions = gC(4);
    metrics.pendingComments = gC(5);
    metrics.scheduledArticles = gC(6);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aArts = gD(7).map((a: any) => ({
      id: a.id, type: 'article', title: `New article: ${a.title}`, user: a.author?.full_name || 'Admin', ts: a.created_at, href: `/admin/articles/${a.id}/edit`
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aSubs = gD(8).map((s: any) => ({
      id: s.id, type: 'submission', title: `Guest submission: ${s.title}`, user: s.name || 'Guest', ts: s.created_at, href: `/admin/submissions`
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aComs = gD(9).map((c: any) => ({
      id: c.id, type: 'comment', title: `Commented: "${c.content.substring(0, 30)}..."`, user: c.profiles?.full_name || c.guest_name || 'Anonymous', ts: c.created_at, href: `/admin/comments`
    }));

    metrics.recentActivity = [...aArts, ...aSubs, ...aComs].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 6);

  } catch (e) { console.error('Dashboard fetch err:', e); }

  const roleLabel = isSuperAdmin ? 'Super Admin · Overview Dashboard' : 'Admin · Overview';

  return (
    <PresenceWrapper className="bg-[#f0f2f5] dark:bg-[#0b141a]">
      {/* ── Presence Header ── */}
      <PresenceHeader 
        title="Super Admin"
        roleLabel={roleLabel}
        initials={initials}
        icon1Node={<Send className="w-5 h-5" strokeWidth={1.5} />}
        icon2Node={<Bell className="w-5 h-5" strokeWidth={1.5} />}
        icon1Href="/admin/submissions"
        icon2Href="/admin/audit-logs"
        icon1Badge={metrics.pendingSubmissions > 0}
        icon2Badge={metrics.pendingComments > 0}
      />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
        
        {/* Analytics Summary */}
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-text)] mb-4">Account Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PresenceCard className="flex flex-col p-4">
              <span className="text-[13px] font-semibold text-[var(--color-muted)] mb-1">Total Articles</span>
              <span className="text-[24px] font-bold text-[var(--color-text)]">{metrics.totalArticles}</span>
            </PresenceCard>
            <PresenceCard className="flex flex-col p-4">
              <span className="text-[13px] font-semibold text-[var(--color-muted)] mb-1">Monthly Readers</span>
              <span className="text-[24px] font-bold text-[var(--color-text)]">{metrics.monthlyReaders}</span>
            </PresenceCard>
            <PresenceCard className="flex flex-col p-4">
              <span className="text-[13px] font-semibold text-[var(--color-muted)] mb-1">Active Authors</span>
              <span className="text-[24px] font-bold text-[var(--color-text)]">{metrics.activeAuthors}</span>
            </PresenceCard>
            <PresenceCard className="flex flex-col p-4">
              <span className="text-[13px] font-semibold text-[var(--color-muted)] mb-1">Community Acts</span>
              <span className="text-[24px] font-bold text-[var(--color-text)]">{metrics.communityEngagement}</span>
            </PresenceCard>
          </div>
        </div>

        {/* Dashboard Card System */}
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-text)] mb-4">Operations Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <PresenceCard className="p-4 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[var(--color-text)]">New Submissions</h3>
                </div>
                <p className="text-[28px] font-black text-[var(--color-text)] leading-none">{metrics.pendingSubmissions}</p>
                <p className="text-[12px] text-[var(--color-muted)] mt-1">Pending guest articles</p>
              </div>
              <Link href="/admin/submissions" className="mt-4 text-[13px] font-semibold text-[var(--color-primary)] hover:underline">Review all</Link>
            </PresenceCard>

            <PresenceCard className="p-4 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <MessageSquare className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[var(--color-text)]">Recent Comments</h3>
                </div>
                <p className="text-[28px] font-black text-[var(--color-text)] leading-none">{metrics.pendingComments}</p>
                <p className="text-[12px] text-[var(--color-muted)] mt-1">Comments needing review</p>
              </div>
              <Link href="/admin/comments" className="mt-4 text-[13px] font-semibold text-[var(--color-primary)] hover:underline">Moderate</Link>
            </PresenceCard>

            <PresenceCard className="p-4 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[var(--color-text)]">Scheduled Articles</h3>
                </div>
                <p className="text-[28px] font-black text-[var(--color-text)] leading-none">{metrics.scheduledArticles}</p>
                <p className="text-[12px] text-[var(--color-muted)] mt-1">Set for future publishing</p>
              </div>
              <Link href="/admin/articles" className="mt-4 text-[13px] font-semibold text-[var(--color-primary)] hover:underline">Manage pipeline</Link>
            </PresenceCard>

          </div>
        </div>

        {/* Recent Activity Panel */}
        <div>
          <PresenceSectionHeader title="Recent Activity" action="See Logs" actionHref="/admin/audit-logs" />
          <PresenceCard className="overflow-hidden noPadding">
            <div className="divide-y divide-[var(--color-border)]">
              {metrics.recentActivity.map((activity, idx) => (
                <Link key={idx} href={activity.href} className="flex grid grid-cols-1 sm:grid-cols-4 items-center p-4 hover:bg-[var(--color-surface-2)] transition-colors gap-3 sm:gap-4">
                  
                  {/* Action / Title */}
                  <div className="col-span-1 border-b sm:border-0 border-transparent sm:col-span-2 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                      {activity.type === 'article' && <FileText className="w-5 h-5 text-[var(--color-text)]" strokeWidth={1.5} />}
                      {activity.type === 'submission' && <Send className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.5} />}
                      {activity.type === 'comment' && <MessageSquare className="w-5 h-5 text-orange-500" strokeWidth={1.5} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--color-text)] truncate">{activity.title}</p>
                      <p className="text-[12px] font-medium text-[var(--color-muted)] block sm:hidden">By {activity.user} · {new Date(activity.ts).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* User (hidden on very small mobile, visible sm up) */}
                  <div className="hidden sm:block col-span-1 truncate">
                    <span className="text-[13px] font-medium text-[var(--color-muted)]">{activity.user}</span>
                  </div>

                  {/* Timestamp & Icon */}
                  <div className="hidden sm:flex col-span-1 justify-between items-center whitespace-nowrap">
                    <span className="text-[12px] text-[var(--color-muted)] font-medium">
                      {new Date(activity.ts).toLocaleDateString()} {new Date(activity.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" strokeWidth={2} />
                  </div>
                  
                </Link>
              ))}
              {metrics.recentActivity.length === 0 && (
                <div className="p-8 text-center text-[var(--color-muted)] text-[14px] font-medium">No recent activity found.</div>
              )}
            </div>
          </PresenceCard>
        </div>

        <div className="pt-2">
          <ReaderModeSwitch role={profile?.role as 'super_admin' | 'admin' | 'editor' | 'reader'} />
        </div>

      </div>
    </PresenceWrapper>
  );
}
