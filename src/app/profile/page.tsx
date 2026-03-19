import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--color-muted)] font-bold">Profile not found.</p>
      </div>
    );
  }

  // ── FETCH STATS ───────────────────────────────────────────
  // 1. Articles Read (Views)
  const { count: readCount } = await supabase
    .from('article_views')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 2. Bookmarks
  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 3. Comments
  const { count: commentCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 4. Highlights
  const { count: highlightCount } = await supabase
    .from('article_highlights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 5. Recent Login Events
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('action, created_at, ip_address, user_agent')
    .eq('user_id', user.id)
    .ilike('action', '%LOGIN%')
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = {
    articlesRead: readCount || 0,
    bookmarks: bookmarkCount || 0,
    comments: commentCount || 0,
    highlights: highlightCount || 0,
    auditLogs: auditLogs || []
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">Account Settings</h1>
        <p className="text-sm font-medium text-[var(--color-muted)] mt-1">
          Manage your identity and track your reading journey
        </p>
      </header>

      <ProfileForm 
        profile={profile} 
        userEmail={user.email} 
        stats={stats}
      />
    </div>
  );
}
