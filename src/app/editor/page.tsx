import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SquarePen, FileText, ChevronRight, Eye, Bell } from 'lucide-react';
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

export default async function EditorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let profile: { full_name: string | null; role: string } | null = null;
  const statsFallback = {
    totalCount: 0, publishedCount: 0, draftCount: 0, reviewCount: 0,
    recent: [] as any[]
  };

  let pageData = statsFallback;

  try {
    const { data: p } = await supabase
      .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    profile = p as any;

    if (!profile || profile.role !== 'editor') redirect('/login');

    // ── Stats with fetch settlement ─────────────────────────────────
    const results = await Promise.allSettled([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'published').eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'draft').eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'in_review').eq('is_deleted', false),
      supabase.from('articles').select('id, title, status, updated_at, slug').eq('author_id', user.id).eq('is_deleted', false).order('updated_at', { ascending: false }).limit(5),
    ]);

    const getVal = (idx: number) => (results[idx].status === 'fulfilled' ? (results[idx] as any).value : null);

    pageData = {
      totalCount: getVal(0)?.count ?? 0,
      publishedCount: getVal(1)?.count ?? 0,
      draftCount: getVal(2)?.count ?? 0,
      reviewCount: getVal(3)?.count ?? 0,
      recent: getVal(4)?.data || [],
    };
  } catch (err) {
    console.error('Editor dashboard fetch error:', err);
  }

  const { totalCount, publishedCount, draftCount, reviewCount, recent } = pageData;

  const initials = (profile?.full_name || 'E').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Editor"
        roleLabel="Editor Workspace"
        initials={initials}
        icon1={Bell}
        icon2={Eye}
        icon2Href="/"
      />

      <div className="px-5 pb-10 space-y-6 relative z-20">
        <PresenceCard className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <SquarePen className="w-6 h-6" />
            </div>
            <p className="font-bold text-gray-600 dark:text-gray-300">New Article</p>
          </div>
          <Link href="/editor/articles/new">
            <PresenceButton>Write</PresenceButton>
          </Link>
        </PresenceCard>

        <PresenceCard>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black text-[#5c4ae4]">
                {totalCount}
                <FileText className="inline-block w-4 h-4 ml-1 mb-6 text-indigo-300" />
              </span>
              <div>
                <p className="text-lg font-black leading-none">Total Articles</p>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Your Progress</p>
              </div>
            </div>
            <Link href="/editor/articles" className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-50 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <PresenceStatCircle percent={Math.min(100, (publishedCount / (totalCount || 1)) * 100)} value={publishedCount} label="Published" color="#10b981" />
            <PresenceStatCircle percent={Math.min(100, (reviewCount / (totalCount || 1)) * 100)} value={reviewCount} label="Review" color="#f59e0b" />
            <PresenceStatCircle percent={Math.min(100, (draftCount / (totalCount || 1)) * 100)} value={draftCount} label="Drafts" color="#6b7280" />
          </div>
        </PresenceCard>

        <PresenceCard className="grid grid-cols-2 gap-y-6">
          <PresenceActionTile href="/editor/articles/new" icon={SquarePen} label="Write New" />
          <PresenceActionTile href="/editor/articles" icon={FileText} label="My Articles" />
        </PresenceCard>

        <div className="pt-4">
          <ReaderModeSwitch role="editor" />
        </div>

        <div className="pt-4">
          <PresenceSectionHeader title="Recent Activity" action="See All" actionHref="/editor/articles" />
          <div className="space-y-3">
            {recent.map((a) => (
              <Link key={a.id} href={`/editor/articles/${a.id}/edit`}>
                <PresenceCard className="flex items-center justify-between py-4 px-5 active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{a.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{(a.status || 'draft').replace('_', ' ')} · {new Date(a.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </PresenceCard>
              </Link>
            ))}
            {recent.length === 0 && (
              <div className="py-10 text-center text-gray-400 font-bold text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </PresenceWrapper>
  );
}
