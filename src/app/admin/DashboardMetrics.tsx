import { createClient } from '@/lib/supabase/server';
import { FileText, Users, Activity, MessageSquare, Send, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PresenceCard, PresenceSectionHeader } from '@/components/PresenceUI';

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
    pendingSubmissions: gC(4),
    pendingComments: gC(5),
    scheduledArticles: gC(6),
  };

  const aArts: DashboardActivity[] = (gD(7)).map((a: any) => ({
    id: a.id, type: 'article', title: `New article: ${a.title}`, user: a.author?.full_name || 'Admin', ts: a.created_at, href: `/admin/articles/${a.id}/edit`
  }));
  const aSubs: DashboardActivity[] = (gD(8)).map((s: any) => ({
    id: s.id, type: 'submission', title: `Guest submission: ${s.title}`, user: s.name || 'Guest', ts: s.created_at, href: `/admin/submissions`
  }));
  const aComs: DashboardActivity[] = (gD(9)).map((c: any) => ({
    id: c.id, type: 'comment', title: `Commented: "${c.content.substring(0, 30)}..."`, user: c.profiles?.full_name || c.guest_name || 'Anonymous', ts: c.created_at, href: `/admin/comments`
  }));

  const recentActivity = [...aArts, ...aSubs, ...aComs].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 6);

  return (
    <>
      {/* Analytics Summary */}
      <div>
        <h2 className="text-[18px] font-bold text-[var(--color-text)] mb-4">Account Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Articles" value={metrics.totalArticles} icon={<FileText className="w-[18px] h-[18px]" />} />
          <StatCard label="Monthly Readers" value={metrics.monthlyReaders} icon={<Users className="w-[18px] h-[18px]" />} />
          <StatCard label="Active Authors" value={metrics.activeAuthors} icon={<Activity className="w-[18px] h-[18px]" />} />
          <StatCard label="Community Acts" value={metrics.communityEngagement} icon={<MessageSquare className="w-[18px] h-[18px]" />} />
        </div>
      </div>

      {/* Platform Summary */}
      <div>
        <h2 className="text-[18px] font-bold text-[var(--color-text)] mb-4">Platform Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard 
             href="/admin/submissions" 
             icon={<Send className="w-5 h-5" />} 
             title="New Submissions" 
             value={metrics.pendingSubmissions} 
             desc="Pending guest articles" 
             color="blue"
          />
          <ActionCard 
             href="/admin/comments" 
             icon={<MessageSquare className="w-5 h-5" />} 
             title="Recent Comments" 
             value={metrics.pendingComments} 
             desc="Comments needing review" 
             color="orange"
          />
          <ActionCard 
             href="/admin/articles" 
             icon={<CheckCircle className="w-5 h-5" />} 
             title="Scheduled Articles" 
             value={metrics.scheduledArticles} 
             desc="Set for future publishing" 
             color="green"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <PresenceSectionHeader title="Recent Activity" action="See Logs" actionHref="/admin/audit-logs" />
        <PresenceCard className="overflow-hidden noPadding">
          <div className="divide-y divide-[var(--color-border)]">
            {recentActivity.map((activity, idx) => (
              <Link key={idx} href={activity.href} className="flex grid grid-cols-1 sm:grid-cols-4 items-center p-4 hover:bg-[var(--color-surface-2)] transition-colors gap-3 sm:gap-4">
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
                <div className="hidden sm:block col-span-1 truncate">
                  <span className="text-[13px] font-medium text-[var(--color-muted)]">{activity.user}</span>
                </div>
                <div className="hidden sm:flex col-span-1 justify-between items-center whitespace-nowrap">
                  <span className="text-[12px] text-[var(--color-muted)] font-medium">
                    {new Date(activity.ts).toLocaleDateString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" strokeWidth={2} />
                </div>
              </Link>
            ))}
            {recentActivity.length === 0 && (
              <div className="p-8 text-center text-[var(--color-muted)] text-[14px] font-medium">No recent activity found.</div>
            )}
          </div>
        </PresenceCard>
      </div>
    </>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <PresenceCard className="flex flex-col p-5 relative overflow-hidden group hover:shadow-md hover:border-[var(--color-border)] transition-all cursor-default">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[13px] font-bold text-[var(--color-muted)] tracking-wide">{label}</span>
        <div className="w-9 h-9 rounded-[10px] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text)] group-hover:bg-[#0047ff]/10 group-hover:text-[#0047ff] transition-colors">
          {icon}
        </div>
      </div>
      <span className="text-[32px] font-extrabold text-[var(--color-text)] tracking-tight leading-none">{value}</span>
    </PresenceCard>
  );
}

function ActionCard({ href, icon, title, value, desc, color }: { href: string, icon: React.ReactNode, title: string, value: number, desc: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:border-blue-500/20 group-hover:bg-blue-600',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:border-orange-500/20 group-hover:bg-orange-500',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 group-hover:border-green-500/20 group-hover:bg-green-500',
  };

  return (
    <Link href={href} className="block focus:outline-none rounded-3xl group">
      <PresenceCard className="p-6 flex flex-col justify-between min-h-[160px] border-2 border-transparent transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#111b21]">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color].split(' group-hover')[0]}`}>
              {icon}
            </div>
            <h3 className="text-[16px] font-extrabold text-[var(--color-text)]">{title}</h3>
          </div>
          <p className="text-[40px] font-extrabold text-[var(--color-text)] leading-none mb-1">{value}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between relative z-10">
          <p className="text-[13px] font-semibold text-[var(--color-muted)]">{desc}</p>
          <div className={`w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text)] transition-all shadow-sm ${colorMap[color].split(' group-hover:')[1] ? 'group-hover:' + colorMap[color].split(' group-hover:')[1].split(' ')[0] + ' group-hover:text-white' : ''}`}>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </div>
        </div>
      </PresenceCard>
    </Link>
  );
}
