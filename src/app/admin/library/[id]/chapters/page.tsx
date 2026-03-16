import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Bell, Layers } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';
import ChaptersClient from './ChaptersClient';

export const dynamic = 'force-dynamic';

export default async function BookChaptersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) redirect('/admin/library');

  const { data: book } = await supabase
    .from('books')
    .select('id, title')
    .eq('id', id)
    .single();

  if (!book) notFound();

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, slug, status, order_index, created_at')
    .eq('book_id', id)
    .order('order_index', { ascending: true });

  const initials = (profile.full_name || user.email || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Book Contents Manager"
        initials={initials}
        icon1Node={<Bell className="w-5 h-5" strokeWidth={1.5} />}
        icon2Node={<ArrowLeft className="w-5 h-5" strokeWidth={1.5} />}
        icon2Href="/admin/library"
      />

      <div className="w-full flex flex-col gap-4 relative z-20">
        <ChaptersClient book={book} chapters={chapters || []} />
      </div>
    </PresenceWrapper>
  );
}
