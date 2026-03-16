import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
} from '@/components/PresenceUI';


import SequelArticlesClient from '../../SequelArticlesClient';

export default async function EditSequelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();

  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .select('title, slug')
    .eq('id', id)
    .single();

  if (sequelError || !sequel) {
    return notFound();
  }

  // Fetch all published articles for the library
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, published_at')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  // Fetch articles currently attached to this sequel
  const { data: attachedArticles } = await supabase
    .from('sequel_articles')
    .select('article_id, order_index')
    .eq('sequel_id', id)
    .order('order_index', { ascending: true });

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Series Manager"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin/sequels"
      />
      
      <SequelArticlesClient 
        sequel={{ id, title: sequel.title }}
        availableArticles={articles || []}
        attachedArticles={attachedArticles || []}
      />
    </PresenceWrapper>
  );
}
