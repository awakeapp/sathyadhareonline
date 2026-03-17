import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import TrashManagerClient from './TrashManagerClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export interface TrashItem {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  guest_name?: string;
  deleted_at: string;
  articles?: { title: string };
  status?: string;
  type: 'article' | 'category' | 'sequel' | 'comment';
}

export default async function TrashPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin');
  }

  const { data: articles } = await supabase.from('articles').select('id, title, deleted_at, status').eq('is_deleted', true).order('deleted_at', { ascending: false });
  const { data: categories } = await supabase.from('categories').select('id, name, deleted_at').eq('is_deleted', true).order('deleted_at', { ascending: false });
  const { data: sequels } = await supabase.from('sequels').select('id, title, deleted_at').eq('is_deleted', true).order('deleted_at', { ascending: false });
  
  const { data: rawComments } = await supabase
    .from('comments')
    .select('id, content, guest_name, deleted_at, articles(title)')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  const mappedArticles: TrashItem[] = (articles || []).map(a => ({ ...a, type: 'article' }));
  const mappedCategories: TrashItem[] = (categories || []).map(c => ({ ...c, type: 'category' }));
  const mappedSequels: TrashItem[] = (sequels || []).map(s => ({ ...s, type: 'sequel' }));
  const mappedComments: TrashItem[] = (rawComments || []).map(c => ({
    ...c,
    type: 'comment',
    articles: Array.isArray(c.articles) ? (c.articles[0] as { title: string }) : (c.articles as { title: string } | null || undefined)
  }));

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Trash Bin" 
        hideActions={true} 
      />
      
      <div className="w-full flex flex-col gap-4 relative z-20">
        <TrashManagerClient 
          initialArticles={mappedArticles}
          initialCategories={mappedCategories}
          initialSequels={mappedSequels}
          initialComments={mappedComments}
        />
      </div>
    </PresenceWrapper>
  );
}
