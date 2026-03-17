import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import PremiumWriteClient from '@/app/admin/articles/write/PremiumWriteClient';
import TurndownService from 'turndown';

export const dynamic = 'force-dynamic';

export default async function EditorPremiumWritePage() {
  const supabase = await createClient();

  // Determine user role and profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role || 'reader';

  if (role !== 'editor') {
    redirect('/');
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  async function savePremiumArticleAction(data: any, isDraft: boolean = false) {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) throw new Error('Unauthorized');

    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const markdownContent = td.turndown(data.body);

    const title = data.title;
    const author_name = data.authorName;
    const category_id = data.categoryId;
    const excerpt = data.summary;
    
    let status = 'draft';
    if (!isDraft) {
      status = 'in_review';
    }
    
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u0080-\uFFFF]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) + '-' + Math.random().toString(36).substring(2, 7);

    const { data: inserted, error: insertError } = await supabaseAction
      .from('articles')
      .insert({
        title,
        slug,
        excerpt,
        content: markdownContent,
        category_id: category_id || null,
        status,
        author_id: actionUser.id,
        author_name,
        published_at: null,
        is_standalone: true,
      })
      .select('id')
      .maybeSingle();

    if (insertError || !inserted) {
      console.error('Error inserting article:', insertError);
      throw new Error('Failed to save article');
    }

    await logAuditEvent(actionUser.id, 'ARTICLE_CREATED_PREMIUM', {
      article_id: inserted.id,
      title,
      status,
    });

    revalidatePath('/');
    revalidatePath('/admin/articles');
    revalidatePath('/editor/articles');

    return { success: true, id: inserted.id };
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-background)]">
      <PremiumWriteClient 
        categories={categories || []}
        authorName={profile?.full_name || ''}
        onSave={savePremiumArticleAction}
      />
    </div>
  );
}
