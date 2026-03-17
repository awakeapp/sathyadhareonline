'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import TurndownService from 'turndown';

export async function saveSequelBundleAction(data: any, status: 'draft' | 'published' | 'in_review') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthenticated');

  // Verify Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  const role = profile?.role || 'reader';
  if (!['admin', 'super_admin', 'editor'].includes(role)) {
    throw new Error('Unauthorized');
  }

  // Generate Sequel Slug
  const sequelSlug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9\u0080-\uFFFF]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) + '-' + Math.random().toString(36).substring(2, 7);

  // 1. Insert/Update Sequel
  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .insert({
      title: data.title,
      slug: sequelSlug,
      description: data.description,
      banner_image: data.bannerUrl,
      category_id: data.categoryId || null,
      status: status === 'in_review' ? 'draft' : status, // Sequel table might use different status names
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (sequelError || !sequel) {
    console.error('Sequel Save Error:', sequelError);
    return { success: false, error: 'Failed to initialize sequel registry' };
  }

  // 2. Process Articles
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

  for (let i = 0; i < data.articles.length; i++) {
    const art = data.articles[i];
    
    // Convert body HTML to Markdown
    const markdownContent = td.turndown(art.body || '');
    
    // Generate Article Slug
    const articleSlug = art.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0080-\uFFFF]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) + '-' + Math.random().toString(36).substring(2, 7);

    // Insert Article
    const { data: insertedArt, error: artError } = await supabase
      .from('articles')
      .insert({
        title: art.title,
        slug: articleSlug,
        excerpt: art.summary,
        content: markdownContent,
        category_id: art.categoryId || null,
        cover_image: art.coverImage || null,
        status: status, // Matches bundle status
        author_id: user.id,
        author_name: art.authorName,
        published_at: status === 'published' ? new Date().toISOString() : null,
        is_standalone: false, // Articles inside sequels are not standalone by default
      })
      .select('id')
      .single();

    if (artError || !insertedArt) {
      console.error('Article Save Error:', artError);
      // We could continue or rollback, but for now let's just log
      continue;
    }

    // 3. Link Article to Sequel
    await supabase
      .from('sequel_articles')
      .insert({
        sequel_id: sequel.id,
        article_id: insertedArt.id,
        order_index: i
      });
  }

  await logAuditEvent(user.id, 'SEQUEL_BUNDLE_CREATED', {
    sequel_id: sequel.id,
    article_count: data.articles.length,
    status
  });

  revalidatePath('/admin/sequels');
  revalidatePath('/');
  
  return { success: true, id: sequel.id };
}
