import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import CommentsClient from './CommentsClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
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

  const pendingCount = comments?.filter(c => c.status === 'pending').length ?? 0;
  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel={`Comments · ${pendingCount} Pending Triage`}
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <CommentsClient 
          comments={(comments as any) || []}
          articlesList={articlesList} />
      </div>
    </PresenceWrapper>
  );
}
