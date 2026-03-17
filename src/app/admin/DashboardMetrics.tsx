import { createClient } from '@/lib/supabase/server';
import { FileText, Users, Activity, MessageSquare, Send, CheckCircle, ChevronRight, ArrowRight, Inbox } from 'lucide-react';
import Link from 'next/link';

interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  user: string;
  ts: string;
  href: string;
}

export default async function DashboardMetrics() {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const nowStr = new Date().toISOString();

  const results = await Promise.allSettled([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('article_views').select('*', { count: 'exact', head: true }).gte('viewed_at', thirtyDaysAgo.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'editor', 'super_admin']),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('guest_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('published_at', nowStr),
    // Internal review counts
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('sequels').select('*', { count: 'exact', head: true }).eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'in_review').eq('is_deleted', false),
    // Activity queries
    supabase.from('articles').select('id, title, status, created_at, author:profiles!author_id(full_name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('guest_submissions').select('id, name, title, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('comments').select('id, content, created_at, guest_name, profiles!user_id(full_name)').order('created_at', { ascending: false }).limit(3),
  ]);

  const gC = (i: number) => results[i].status === 'fulfilled' ? (results[i] as any).value?.count ?? 0 : 0;
  const gD = (i: number) => results[i].status === 'fulfilled' ? (results[i] as any).value?.data ?? [] : [];

  const metrics = {
    totalArticles: gC(0),
    monthlyReaders: gC(1),
    activeAuthors: gC(2),
    communityEngagement: gC(3),
    pendingSubmissions: gC(4) + gC(7) + gC(8) + gC(9), // Guests + Staff Articles + Sequels + Books
    pendingComments: gC(5),
    scheduledArticles: gC(6),
  };

  const aArts: DashboardActivity[] = (gD(10)).map((a: any) => ({
    id: a.id, type: 'article', title: `New article: ${a.title}`, user: (Array.isArray(a.author) ? a.author[0]?.full_name : a.author?.full_name) || 'Admin', ts: a.created_at, href: `/admin/articles/${a.id}/edit`
  }));
  const aSubs: DashboardActivity[] = (gD(11)).map((s: any) => ({
    id: s.id, type: 'submission', title: `Guest submission: ${s.title}`, user: s.name || 'Guest', ts: s.created_at, href: `/admin/inbox`
  }));
  const aComs: DashboardActivity[] = (gD(12)).map((c: any) => ({
    id: c.id, type: 'comment', title: `Commented: "${(c.content || '').substring(0, 30)}..."`, user: (Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name) || c.guest_name || 'Anonymous', ts: c.created_at, href: `/admin/comments`
  }));

  const recentActivity = [...aArts, ...aSubs, ...aComs].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      {/* ── METRICS GRID ── */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-3 px-1">Engagement</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Content" value={metrics.totalArticles} icon={<FileText size={18} />} />
          <StatCard label="Readers (30d)" value={metrics.monthlyReaders} icon={<Users size={18} />} />
          <StatCard label="Active Staff" value={metrics.activeAuthors} icon={<Activity size={18} />} />
          <StatCard label="Comments" value={metrics.communityEngagement} icon={<MessageSquare size={18} />} />
        </div>
      </div>

      {/* ── ACTION CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        <ActionCard 
           href="/admin/inbox" 
           icon={<Inbox size={20} />} 
           title="In Review" 
           value={metrics.pendingSubmissions} 
           desc="Content pending review" 
           color="blue"
        />
        <ActionCard 
           href="/admin/comments" 
           icon={<MessageSquare size={20} />} 
           title="Moderation" 
           value={metrics.pendingComments} 
           desc="Pending comments" 
           color="orange"
        />
        <ActionCard 
           href="/admin/content" 
           icon={<CheckCircle size={20} />} 
           title="Scheduled" 
           value={metrics.scheduledArticles} 
           desc="Automated publishing" 
           color="green"
        />
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">Recent Activity</p>
          <Link href="/admin/audit-logs" className="text-[11px] font-extrabold text-[var(--color-primary)] hover:underline underline-offset-4 uppercase tracking-wider">
            Logs →
          </Link>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {recentActivity.map((activity, idx) => (
            <Link 
              key={`${activity.type}-${activity.id}-${idx}`} 
              href={activity.href} 
              className="flex items-center p-4 hover:bg-[var(--color-surface-2)] transition-all gap-4 border-b border-[var(--color-border)] last:border-0 active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                {activity.type === 'article' && <FileText size={18} className="text-[var(--color-text)]" strokeWidth={1.5} />}
                {activity.type === 'submission' && <Send size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />}
                {activity.type === 'comment' && <MessageSquare size={18} className="text-orange-500" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[var(--color-text)] truncate">{activity.title}</p>
                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                  {activity.user} · {(() => {
                    const d = new Date(activity.ts);
                    return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  })()}
                </p>
              </div>
              <ChevronRight size={14} className="text-[var(--color-muted)] opacity-50 shrink-0" />
            </Link>
          ))}
          {recentActivity.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <Activity size={32} className="text-[var(--color-muted)] opacity-20" />
              <p className="text-[14px] font-bold text-[var(--color-muted)]">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-tight">{label}</span>
        <div className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors">
          {icon}
        </div>
      </div>
      <span className="text-[28px] font-black text-[var(--color-text)] tracking-tighter leading-none">{value}</span>
    </div>
  );
}

function ActionCard({ href, icon, title, value, desc, color }: { href: string, icon: React.ReactNode, title: string, value: number, desc: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500',
  };

  return (
    <Link href={href} className="block group">
      <div className="p-5 flex flex-col justify-between bg-[var(--color-surface)] rounded-[1.5rem] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 active:scale-[0.98] transition-all">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color].split(' group-hover')[0]}`}>
              {icon}
            </div>
            <h3 className="text-[15px] font-bold text-[var(--color-text)]">{title}</h3>
          </div>
          <p className="text-[36px] font-black text-[var(--color-text)] leading-none tracking-tighter mb-1">{value}</p>
          <p className="text-[12px] text-[var(--color-muted)] font-medium">{desc}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-[var(--color-primary)]">
          <span className="text-[11px] font-black uppercase tracking-widest">Open Hub</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}
