import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import ArticleFormClient from './ArticleFormClient';
import sharp from 'sharp';

export default async function NewArticlePage() {
  const supabase = await createClient();

  // Determine user role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role || 'reader';

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  if (catError) console.error('Error fetching categories:', catError);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['admin', 'super_admin', 'editor'])
    .order('full_name');

  async function createArticleAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    // We now use author_name from the text input
    const author_name = formData.get('author_name') as string;
    const coverFile = formData.get('cover_image') as File | null;
    const action_type = formData.get('action_type') as string;

    const { data: { user: actionUser }, error: userError } = await supabaseAction.auth.getUser();
    if (userError || !actionUser) throw new Error('Unauthorized');

    const { data: actionProfile } = await supabaseAction
      .from('profiles')
      .select('role')
      .eq('id', actionUser.id)
      .maybeSingle();
    const actionRole = actionProfile?.role || 'reader';

    let status = 'draft';
    if (actionRole === 'editor') {
      if (action_type === 'submit') status = 'in_review';
    } else if (['admin', 'super_admin'].includes(actionRole)) {
      if (action_type === 'publish') status = 'published';
      else if (action_type === 'submit') status = 'in_review';
      else if (action_type === 'schedule') status = 'published'; // Scheduled uses published status with future date
    }

    // Determine published_at
    let published_at = null;
    if (status === 'published') {
      published_at = new Date().toISOString();
      if (action_type === 'schedule') {
         const scheduleDate = formData.get('schedule_date') as string;
         if (scheduleDate) {
            published_at = new Date(scheduleDate).toISOString();
         }
      }
    }

    const { data: inserted, error: insertError } = await supabaseAction
      .from('articles')
      .insert({
        title,
        slug,
        excerpt,
        content,
        category_id: category_id || null,
        status,
        author_id: actionUser.id,
        author_name,
        published_at,
      })
      .select('id')
      .maybeSingle();

    if (insertError || !inserted) {
      console.error('Error inserting article:', insertError);
      return;
    }

    if (coverFile && coverFile.size > 0) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const compressedBuffer = await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const path = `articles/${inserted.id}/cover.webp`;
      const { error: uploadError } = await supabaseAction.storage
        .from('article-images')
        .upload(path, compressedBuffer, { upsert: true, contentType: 'image/webp' });

      if (!uploadError) {
        const { data: urlData } = supabaseAction.storage
          .from('article-images')
          .getPublicUrl(path);

        await supabaseAction
          .from('articles')
          .update({ cover_image: urlData.publicUrl })
          .eq('id', inserted.id);
      }
    }

    // CRIT-04: Audit log + cache revalidation
    await logAuditEvent(actionUser.id, 'ARTICLE_CREATED', {
      article_id: inserted.id,
      title,
      status,
      role: actionRole,
    });

    if (status === 'in_review') {
        const adminMessage = `New article draft submitted by ${profile?.full_name || 'Author'}`;
        await logAuditEvent(actionUser.id, 'NOTIFICATION_SYSTEM', { message: adminMessage });
    }

    revalidatePath('/');
    revalidatePath('/admin/articles');

    redirect('/admin/articles');
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-2)]">
        <ArticleFormClient 
          categories={categories}
          users={users?.map(u => ({ id: u.id, name: u.full_name || 'Unknown' })) || []}
          role={role}
          onSubmit={createArticleAction}
          currentUserId={user.id}
        />
    </div>
  );
}
