import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Shapes, Users, Eye, FileText, Hand, ScrollText, MessageSquare, History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let profile: { full_name: string | null; role: string } | null = null;
  const metricsFallback = {
    totalArticles: 0, totalViews: 0, totalUsers: 0, totalComments: 0,
    pendingComments: 0, newUsersLast7Days: 0, articlesPublishedToday: 0,
    lastAudit: null as { action: string; created_at: string } | null, 
    recentUsers: [] as { id: string; avatar_url?: string; full_name?: string; email?: string }[], 
    recentArticles: [] as { id: string; title: string; status: string }[],
    totalCategories: 0
  };

  let pageData = metricsFallback;

  try {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();
    profile = p;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // ── Metrics fetch with settlement protection ────────────────
    const results = await Promise.allSettled([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('is_deleted', false),
      supabase.from('article_views').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', startOfToday.toISOString()),
      supabase.from('audit_logs').select('action, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('id, full_name, email, avatar_url').order('created_at', { ascending: false }).limit(5),
      supabase.from('articles').select('id, title, status, published_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ]);

    const getVal = (idx: number) => {
      const res = results[idx];
      return res.status === 'fulfilled' ? (res as PromiseFulfilledResult<any>).value : null;
    };

    pageData = {
      totalArticles: getVal(0)?.count ?? 0,
      totalViews: getVal(2)?.count ?? 0,
      totalUsers: getVal(3)?.count ?? 0,
      totalComments: getVal(4)?.count ?? 0,
      pendingComments: getVal(5)?.count ?? 0,
      newUsersLast7Days: getVal(6)?.count ?? 0,
      articlesPublishedToday: getVal(7)?.count ?? 0,
      lastAudit: getVal(8)?.data || null,
      recentUsers: getVal(9)?.data || [],
      recentArticles: getVal(10)?.data || [],
      totalCategories: getVal(11)?.count ?? 0,
    };
  } catch (error) {
    console.error('Critical Admin dashboard fetch error:', error);
  }

  const { 
    totalArticles, totalViews, totalUsers, totalComments, 
    pendingComments, newUsersLast7Days, articlesPublishedToday, 
    lastAudit, recentUsers, recentArticles, totalCategories 
  } = pageData;

  const initials = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();
  const isSuperAdmin = profile?.role === 'super_admin';

  const quickActions = [
    { href: '/admin/articles/new',  label: 'New Article',    icon: Plus, color: 'bg-blue-600' },
    { href: '/admin/articles',      label: 'All Articles',   icon: FileText, color: 'bg-blue-500' },
    { href: '/admin/categories',    label: 'Categories',     icon: Shapes, color: 'bg-indigo-500' },
    { href: '/admin/users',         label: 'Users & Roles',  icon: Users, color: 'bg-amber-500', superOnly: true },
    { href: '/admin/comments',      label: 'Comments',       icon: MessageSquare, color: 'bg-emerald-500' },
    { href: '/admin/audit-logs',    label: 'Audit Logs',     icon: ScrollText, color: 'bg-purple-600', superOnly: true },
  ].filter(a => !a.superOnly || isSuperAdmin);

  const statusColor = (s: string) => {
    if (s === 'published') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (s === 'in_review') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (s === 'archived')  return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <div className="font-sans antialiased max-w-5xl mx-auto py-2">

      {/* ── Profile header ────────────────────────────────────── */}
      <header className="flex items-center justify-between mt-4 mb-8">
        <div>
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Admin Panel</p>
          <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
            {profile?.full_name ? `Hi, ${String(profile.full_name).split(' ')[0]}` : 'Dashboard'}
            {profile?.full_name && <Hand className="w-6 h-6 text-amber-500" />}
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1 capitalize font-semibold">{profile?.role?.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild size="icon" className="rounded-full h-10 w-10">
            <Link href="/admin/articles/new">
              <Plus className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-black text-base shadow-sm">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Metrics grid ───────────────────────────────────────── */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Live Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
        {[
          { 
            label: 'Content', 
            icon: FileText,
            color: 'text-blue-500',
            href: '/admin/articles',
            stats: [
              { name: 'Total Articles', value: totalArticles },
              { name: 'Published Today', value: articlesPublishedToday, highlight: true }
            ] 
          },
          { 
            label: 'Engagement', 
            icon: Eye,
            color: 'text-purple-500',
            href: '/admin/categories',
            stats: [
              { name: 'Total Views', value: totalViews.toLocaleString() },
              { name: 'Categories', value: totalCategories }
            ] 
          },
          { 
            label: 'Community', 
            icon: Users,
            color: 'text-amber-500',
            href: '/admin/users',
            stats: [
              { name: 'Total Users', value: totalUsers },
              { name: 'New (7 days)', value: newUsersLast7Days, highlight: true }
            ] 
          },
          { 
            label: 'Discussions', 
            icon: MessageSquare,
            color: 'text-emerald-500',
            href: '/admin/comments',
            stats: [
              { name: 'Total Comments', value: totalComments },
              { name: 'Pending', value: pendingComments, highlight: pendingComments > 0 }
            ] 
          },
          { 
            label: 'System', 
            icon: History,
            color: 'text-[var(--color-muted)]',
            href: isSuperAdmin ? '/admin/audit-logs' : '#',
            stats: [
              { name: 'Last Event', value: lastAudit?.action?.split('_')[0] || 'Idle' },
              { name: 'Activity', value: lastAudit ? new Date(lastAudit.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'None' }
            ] 
          },
        ].map((group) => (
          <Link key={group.label} href={group.href} className="outline-none block">
            <Card hoverable className="h-full rounded-[2rem] border-transparent bg-[var(--color-surface)] shadow-none transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center opacity-80 ${group.color}`}>
                    <group.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">{group.label}</span>
                </div>
                <div className="space-y-3">
                   {group.stats.map((s: { name: string; value: string | number; highlight?: boolean }) => (
                     <div key={s.name}>
                        <p className="text-2xl font-black tracking-tighter leading-none">{s.value}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${s.highlight ? 'text-amber-500' : 'text-[var(--color-muted)]'}`}>
                          {s.name}
                        </p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a: { href: string; label: string; icon: any; color: string }) => (
            <Link key={a.href} href={a.href} className="group outline-none">
              <Card hoverable className="h-full rounded-[1.5rem] border-transparent bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-2)] transition-colors">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-full">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${a.color}`}>
                    <a.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-center leading-tight">{a.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Articles & Users Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Recent Articles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Recent Articles</h2>
            <Link href="/admin/articles" className="text-xs font-bold text-[var(--color-primary)] hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentArticles?.map((a: { id: string; title: string, status?: string }) => (
              <Link key={a.id} href={`/admin/articles/${a.id}/edit`} className="block group outline-none">
                <Card hoverable className="rounded-2xl">
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <span className="flex-1 text-sm font-bold truncate group-hover:text-[var(--color-primary)] transition-colors">{a.title}</span>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(a.status || 'draft')}`}>
                      {(a.status || 'draft').replace('_', ' ')}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
            {(!recentArticles || recentArticles.length === 0) && (
              <div className="text-center py-8 text-[var(--color-muted)] text-sm font-semibold rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)]">No articles yet</div>
            )}
          </div>
        </section>

        {/* Recent Users */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Recent Users</h2>
            {isSuperAdmin && (
              <Link href="/admin/users" className="text-xs font-bold text-[var(--color-primary)] hover:underline">Manage →</Link>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
            {recentUsers?.map((u: { id: string; avatar_url?: string, full_name?: string, email?: string }) => (
              <div key={u.id} className="shrink-0 flex flex-col items-center gap-2 w-[72px]">
                <div className="w-14 h-14 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-black text-xl overflow-hidden shadow-sm border-2 border-[var(--color-background)]">
                  {u.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (u.full_name || u.email || '?').charAt(0).toUpperCase()
                  }
                </div>
                <span className="text-[11px] font-bold text-center leading-tight truncate w-full">
                  {u.full_name?.split(' ')[0] || 'User'}
                </span>
              </div>
            ))}
            {(!recentUsers || recentUsers.length === 0) && (
              <div className="flex-1 text-center py-8 text-[var(--color-muted)] text-sm font-semibold rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)]">No users yet</div>
            )}
          </div>
        </section>

      </div>

      {/* ── Site link ─────────────────────────────────────────── */}
      <div className="flex justify-center pb-8 border-t border-[var(--color-border)] pt-8">
        <Button asChild variant="secondary" className="rounded-full shadow-sm pr-7 pl-6">
          <Link href="/">
            <Eye className="w-4 h-4 mr-2" />
            View Live Site
          </Link>
        </Button>
      </div>

    </div>
  );
}
