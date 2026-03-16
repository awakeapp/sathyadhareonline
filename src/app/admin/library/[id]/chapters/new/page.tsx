import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createChapter } from '../../../actions';
import ChapterEditorClient from '../ChapterEditorClient';

export default async function NewChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'reader';

  if (!['admin', 'super_admin', 'editor'].includes(role)) redirect('/admin/library');

  async function handleSubmit(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;

    const res = await createChapter(bookId, { title, content, status });
    if (res.success) {
      redirect(`/admin/library/${bookId}/chapters`);
    }
  }

  return (
    <ChapterEditorClient bookId={bookId} role={role} onSubmit={handleSubmit} />
  );
}
