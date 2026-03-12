import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import ArticleFormClient from './ArticleFormClient';
import { ChevronLeft, Bell, FileText } from 'lucide-react';

import { 
  PresenceWrapper, 
  PresenceHeader,
} from '@/components/PresenceUI';

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

  async function createArticleAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
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
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .maybeSingle();

    if (insertError || !inserted) {
      console.error('Error inserting article:', insertError);
      return;
    }

    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split('.').pop();
      const path = `articles/${inserted.id}/cover.${ext}`;
      const { error: uploadError } = await supabaseAction.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });

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
    revalidatePath('/');
    revalidatePath('/admin/articles');

    redirect('/admin/articles');
  }


  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Article Weaver · Creation Matrix"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin/articles"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20 max-w-4xl mx-auto">
        
        <div className="flex items-center gap-5 mb-6">
           <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <FileText className="w-6 h-6" strokeWidth={1.25} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Birth of Narrative</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Initializing new document sequence</p>
           </div>
        </div>

        <ArticleFormClient 
          categories={categories}
          role={role}
          onSubmit={createArticleAction}
          defaultAuthorName={profile?.full_name || ''}
        />
      </div>
    </PresenceWrapper>
  );
}
