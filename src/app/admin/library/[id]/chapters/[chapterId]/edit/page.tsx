import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { updateChapter } from '../../../../actions';
import ChapterEditorClient from '../../ChapterEditorClient';

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id: bookId, chapterId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'reader';

  if (!['admin', 'super_admin', 'editor'].includes(role)) redirect('/admin/library');

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, title, content, status')
    .eq('id', chapterId)
    .single();

  if (!chapter) notFound();

  async function handleSubmit(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;

    const res = await updateChapter(chapterId, { title, content, status });
    if (res.success) {
      redirect(`/admin/library/${bookId}/chapters`);
    }
  }

  return (
    <ChapterEditorClient 
      bookId={bookId} 
      chapter={chapter} 
      role={role} 
      onSubmit={handleSubmit} 
    />
  );
}
