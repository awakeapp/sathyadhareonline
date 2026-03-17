import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CommentsClient from './CommentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      id,
      article_id,
      guest_name,
      user_id,
      content,
      status,
      is_spam,
      created_at,
      articles ( title ),
      profiles ( full_name, email )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching comments:', error);

  const articleMap = new Map<string, string>();
  for (const c of comments || []) {
    if (c.article_id && !articleMap.has(c.article_id)) {
       articleMap.set(c.article_id, (c.articles as any)?.title || c.article_id);
    }
  }
  const articlesList = Array.from(articleMap.entries()).map(([id, title]) => ({ id, title }));

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Comments & Moderation</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Review, approve, or remove discussion across articles</p>
      </div>

      <div className="w-full">
        <CommentsClient 
          comments={(comments as any) || []}
          articlesList={articlesList} />
      </div>
    </div>
  );
}
