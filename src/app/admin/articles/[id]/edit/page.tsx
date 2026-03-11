import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { CoverImageUpload } from './CoverImageUpload';
import { Star, ChevronLeft } from 'lucide-react';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth & Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role || 'reader';

  // Fetch article data
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category_id, status, cover_image, is_featured, published_at')
    .eq('id', id)
    .single();

  if (articleError || !article) {
    notFound();
    return null; // For TypeScript
  }

  // Fetch categories for dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  // ── Server Actions ───────────────────────────────────────────

  async function updateArticleAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const title       = formData.get('title') as string;
    const slug        = formData.get('slug') as string;
    const excerpt     = formData.get('excerpt') as string;
    const content     = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    const is_featured = formData.get('is_featured') === 'on';
    const coverFile   = formData.get('cover_image') as File | null;
    
    // Check role again securely via action context
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;
    const { data: actionProfile } = await supabaseAction.from('profiles').select('role').eq('id', actionUser.id).single();
    const actionRole = actionProfile?.role || 'reader';

    let targetStatus = formData.get('status') as string;

    // Server-side guard: Editors cannot publish or archive
    if (actionRole === 'editor' && ['published', 'archived'].includes(targetStatus)) {
      targetStatus = 'in_review'; // Force to review status
    }

    const updateData: Record<string, unknown> = {
      title,
      slug,
      excerpt,
      content,
      category_id: category_id || null,
      status: targetStatus,
      is_featured,
      updated_at: new Date().toISOString(),
      published_at: targetStatus === 'published' && article?.status !== 'published' 
                      ? new Date().toISOString() 
                      : (targetStatus !== 'published' ? null : article?.published_at), // retain previous if still published else null
    };

    if (is_featured) {
      await supabaseAction.from('articles').update({ is_featured: false }).neq('id', id);
    }

    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split('.').pop();
      const path = `articles/${id}/cover.${ext}`;
      const { error: uploadError } = await supabaseAction.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });

      if (!uploadError) {
        const { data: urlData } = supabaseAction.storage.from('article-images').getPublicUrl(path);
        const ts = new Date().getTime();
        updateData.cover_image = `${urlData.publicUrl}?t=${ts}`;
      }
    }

    const { error } = await supabaseAction.from('articles').update(updateData).eq('id', id);
    if (error) { console.error('Update failed:', error); return; }

    await logAuditEvent(actionUser.id, 'ARTICLE_UPDATED', { article_id: id });

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  async function publishNowAction() {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    const { data: p } = await supabaseAction.from('profiles').select('role').eq('id', actionUser.id).single();
    if (!p || !['admin', 'super_admin'].includes(p.role)) return;

    await supabaseAction
      .from('articles')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    await logAuditEvent(actionUser.id, 'ARTICLE_PUBLISHED', { article_id: id });

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/articles" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Edit Article</h1>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                article.status === 'published' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : article.status === 'in_review'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
              }`}>
                {article.status.replace('_', ' ')}
              </div>
              {['admin', 'super_admin'].includes(role) && article.status !== 'published' && (
                <form action={publishNowAction}>
                  <button type="submit" className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-black px-3 py-1 rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                    Publish Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
          <form action={updateArticleAction} encType="multipart/form-data" className="p-6 md:p-8 space-y-6">
            
            {['admin', 'super_admin'].includes(role) && (
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                article.is_featured ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] bg-black/20'
              }`}>
                <div className="flex items-center gap-3">
                  <Star className={`w-6 h-6 ${article.is_featured ? 'text-[var(--color-primary)]' : 'opacity-40'}`} fill={article.is_featured ? "currentColor" : "none"} />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Feature on Homepage</p>
                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Displays as hero banner.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input type="checkbox" name="is_featured" defaultChecked={article.is_featured ?? false} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-[var(--color-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Cover Image</label>
              <div className="bg-black/20 border border-[var(--color-border)] rounded-2xl p-2">
                <CoverImageUpload currentImageUrl={article.cover_image} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Headline</label>
              <input name="title" required defaultValue={article.title} className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">URL Slug</label>
                <input name="slug" required defaultValue={article.slug} className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white font-mono text-sm outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Visibility</label>
                <select name="status" defaultValue={article.status} className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white outline-none">
                  {role === 'editor' ? (
                    <>
                      <option value="draft">Draft</option>
                      <option value="in_review">In Review</option>
                    </>
                  ) : (
                    <>
                      <option value="draft">Draft</option>
                      <option value="in_review">In Review</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Category</label>
              <select name="category_id" defaultValue={article.category_id ?? ''} className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white outline-none">
                <option value="">Uncategorized Collection</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Brief Summary</label>
              <textarea name="excerpt" rows={3} defaultValue={article.excerpt ?? ''} className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white outline-none resize-none leading-relaxed" />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Content</label>
              <RichTextEditor name="content" defaultValue={article.content ?? ''} />
            </div>

            <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-end gap-3">
              <Link href="/admin/articles" className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-[var(--color-border)] font-semibold text-[var(--color-muted)] hover:text-white text-center">Discard</Link>
              <button type="submit" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--color-primary)] text-black font-bold hover:bg-[#ffed4a] transition-colors shadow-lg shadow-[var(--color-primary)]/20 text-center">Save Changes</button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
