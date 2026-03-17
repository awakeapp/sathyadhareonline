import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, Send } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';
import SubmissionsClient from './SubmissionsClient';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/admin');

  // Fetch all pending review items
  const [articles, sequels, books, guests] = await Promise.all([
    supabase.from('articles').select('id, title, status, created_at, author:profiles!author_id(full_name)').eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('sequels').select('id, title, status, created_at').eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('books').select('id, title, status, created_at').eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('guest_submissions').select('id, title, name, created_at').eq('status', 'pending'),
  ]);

  const staffItems: any[] = [
    ...(articles.data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      type: 'article',
      author: (Array.isArray(a.author) ? a.author[0]?.full_name : a.author?.full_name) || 'Anonymous',
      created_at: a.created_at
    })),
    ...(sequels.data || []).map(s => ({
      id: s.id,
      title: s.title,
      type: 'sequel',
      author: 'Admin',
      created_at: s.created_at
    })),
    ...(books.data || []).map(b => ({
      id: b.id,
      title: b.title,
      type: 'book',
      author: 'Admin',
      created_at: b.created_at
    }))
  ];

  const guestItems: any[] = (guests.data || []).map(g => ({
    id: g.id,
    title: g.title || 'Untitled Submission',
    type: 'guest',
    author: g.name || 'Anonymous',
    created_at: g.created_at
  }));

  const initials = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Submissions"
        roleLabel={`Review Queue · ${staffItems.length + guestItems.length} Total Pending`}
        initials={initials}
        icon1Node={<Send className="w-5 h-5" strokeWidth={1.5} />}
        icon2Node={<Bell className="w-5 h-5" strokeWidth={1.5} />}
      />

      <div className="w-full flex flex-col gap-4 relative z-20">
        <SubmissionsClient staffItems={staffItems} guestItems={guestItems} />
      </div>
    </PresenceWrapper>
  );
}
