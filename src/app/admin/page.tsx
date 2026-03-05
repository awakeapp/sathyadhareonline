import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, LayoutTemplate, Shapes, Users, BarChart3, Settings, Eye, FileText, Layers, Image as ImageIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.role === 'super_admin';

  // ── Real metrics ────────────────────────────────────────────
  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: draftArticles },
    { count: inReviewArticles },
    { count: totalViews },
    { count: totalCategories },
    { count: totalUsers },
    { data: recentUsers },
    { data: recentArticles },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('is_deleted', false),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft').eq('is_deleted', false),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('article_views').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, email, avatar_url').order('created_at', { ascending: false }).limit(5),
    supabase.from('articles').select('id, title, status, published_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
  ]);

  const initials = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();

  const quickActions = [
    { href: '/admin/articles/new',  label: 'New Article',    icon: Plus, color: '#0047ff' },
    { href: '/admin/articles',      label: 'All Articles',   icon: FileText, color: '#0047ff' },
    { href: '/admin/categories',    label: 'Categories',     icon: Shapes, color: '#0047ff' },
    { href: '/admin/series',        label: 'Series',         icon: Layers, color: '#0047ff' },
    { href: '/admin/media',         label: 'Media Library',  icon: ImageIcon, color: '#0047ff' },
    { href: '/admin/users',         label: 'Users & Roles',  icon: Users, color: '#0047ff' },
  ];

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
          <h1 className="text-2xl font-black tracking-tight mt-1">
            {profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]} 👋` : 'Dashboard'}
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

      {/* ── Metrics row ──────────────────────────────────────── */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Highlights</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
        {[
          { label: 'Total',     value: totalArticles ?? 0,    sub: 'articles',  color: '#0047ff' },
          { label: 'Published', value: publishedArticles ?? 0, sub: 'live',      color: '#10b981' },
          { label: 'In Review', value: inReviewArticles ?? 0,  sub: 'pending',   color: '#f59e0b' },
          { label: 'Draft',     value: draftArticles ?? 0,     sub: 'editing',   color: '#6b7280' },
          { label: 'Views',     value: (totalViews ?? 0).toLocaleString(), sub: 'total', color: '#8b5cf6' },
          { label: 'Users',     value: totalUsers ?? 0,        sub: 'registered', color: '#ec4899' },
          { label: 'Categories', value: totalCategories ?? 0,  sub: 'active',    color: '#0047ff' },
        ].map((m) => (
          <Card key={m.label} hoverable className="rounded-[1.5rem]">
            <CardContent className="p-4 flex flex-col gap-1 items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{m.label}</span>
              <span className="text-2xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</span>
              <span className="text-[10px] text-[var(--color-muted)] font-semibold">{m.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="group outline-none">
              <Card hoverable className="h-full rounded-[1.5rem] border-transparent bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-2)] transition-colors">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-full">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: a.color }}>
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
            {recentArticles?.map((a) => (
              <Link key={a.id} href={`/admin/articles/${a.id}/edit`} className="block group outline-none">
                <Card hoverable className="rounded-2xl">
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <span className="flex-1 text-sm font-bold truncate group-hover:text-[var(--color-primary)] transition-colors">{a.title}</span>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(a.status)}`}>
                      {a.status.replace('_', ' ')}
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
            {recentUsers?.map((u) => (
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
