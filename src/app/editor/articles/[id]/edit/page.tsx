import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { CoverImageUpload } from '@/app/admin/articles/[id]/edit/CoverImageUpload';
import { Send } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditorEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth + role guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

  // ── Fetch the article — must belong to this editor ───────────────
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category_id, status, cover_image, author_id')
    .eq('id', id)
    .single();

  if (error || !article) notFound();

  // Prevent editing other editors' articles
  if (article.author_id !== user.id) {
    redirect('/editor/articles');
  }

  // Editors may only edit draft or in_review articles (not published/archived)
  const isEditable = ['draft', 'in_review'].includes(article.status ?? '');

  const { data: categories } = await supabase
    .from('categories').select('id, name').order('name');

  // ── Server action: save changes ──────────────────────────────────
  async function updateAction(formData: FormData) {
    'use server';
    const sb = await createClient();

    // Re-verify caller
    const { data: { user: actionUser } } = await sb.auth.getUser();
    if (!actionUser) return;

    const { data: actionProfile } = await sb
      .from('profiles').select('role').eq('id', actionUser.id).single();
    if (!actionProfile || actionProfile.role !== 'editor') return;

    // Ensure the article belongs to this editor
    const { data: existingArticle } = await sb
      .from('articles').select('author_id, status').eq('id', id).single();
    if (!existingArticle || existingArticle.author_id !== actionUser.id) return;

    const title       = formData.get('title') as string;
    const slug        = formData.get('slug') as string;
    const excerpt     = formData.get('excerpt') as string;
    const content     = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    const coverFile   = formData.get('cover_image') as File | null;

    const updateData: Record<string, unknown> = {
      title,
      slug,
      excerpt,
      content,
      category_id: category_id || null,
      updated_at:  new Date().toISOString(),
      // Editors cannot change status via this form — only via the
      // "Submit for Review" button which transitions draft → in_review
    };

    // Cover image upload
    if (coverFile && coverFile.size > 0) {
      const ext  = coverFile.name.split('.').pop();
      const path = `articles/${id}/cover.${ext}`;
      const { error: uploadError } = await sb.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });
      if (!uploadError) {
        const { data: urlData } = sb.storage.from('article-images').getPublicUrl(path);
        updateData.cover_image = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      }
    }

    const { error: updateError } = await sb.from('articles').update(updateData).eq('id', id);
    if (updateError) { console.error('Update error:', updateError); return; }

    revalidatePath('/editor/articles');
    revalidatePath(`/articles/${slug}`);
    redirect('/editor/articles');
  }

  // ── Server action: submit for review ─────────────────────────────
  async function submitForReviewAction(formData: FormData) {
    'use server';
    const sb = await createClient();
    const { data: { user: actionUser } } = await sb.auth.getUser();
    if (!actionUser) return;

    const { data: actionProfile } = await sb
      .from('profiles').select('role').eq('id', actionUser.id).single();
    if (!actionProfile || actionProfile.role !== 'editor') return;

    // Only allow transitioning own articles out of draft
    const { data: existingArticle } = await sb
      .from('articles').select('author_id, status').eq('id', id).single();
    if (!existingArticle || existingArticle.author_id !== actionUser.id) return;
    if (existingArticle.status !== 'draft') return;

    const articleId = formData.get('id') as string;
    await sb.from('articles').update({ status: 'in_review', updated_at: new Date().toISOString() }).eq('id', articleId);

    revalidatePath('/editor/articles');
    redirect('/editor/articles');
  }

  // ── UI ───────────────────────────────────────────────────────────
  const statusColors: Record<string, string> = {
    draft:     'bg-gray-500/10 text-gray-400 border-gray-500/20',
    in_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    archived:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="min-h-full pb-20 px-4 pt-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/editor/articles"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-95">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Edit Article</h1>
            <p className="text-xs text-white/30 mt-0.5">Your article · changes are saved immediately</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[article.status ?? 'draft'] ?? statusColors.draft}`}>
            {article.status}
          </span>
        </div>
      </div>

      {/* Read-only banner for published/archived */}
      {!isEditable && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-xs text-amber-400">
            This article is <strong>{article.status}</strong> and can no longer be edited. Contact an admin if changes are needed.
          </p>
        </div>
      )}

      {/* Form card */}
      <div className="bg-[#181623] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <form action={updateAction} encType="multipart/form-data" className="p-6 md:p-8 space-y-6">

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1">Cover Image</label>
            <div className="bg-black/20 border border-white/8 rounded-2xl p-2">
              <CoverImageUpload currentImageUrl={article.cover_image} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="title">
              Title
            </label>
            <input required disabled={!isEditable} id="title" name="title" type="text"
              defaultValue={article.title}
              className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slug */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="slug">
                URL Slug
              </label>
              <input required disabled={!isEditable} id="slug" name="slug" type="text"
                defaultValue={article.slug}
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="category_id">
                Category
              </label>
              <div className="relative">
                <select disabled={!isEditable} id="category_id" name="category_id"
                  defaultValue={article.category_id ?? ''}
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="" className="bg-[#181623]">Uncategorized</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#181623]">{cat.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="excerpt">
              Excerpt
            </label>
            <textarea disabled={!isEditable} id="excerpt" name="excerpt" rows={3}
              defaultValue={article.excerpt ?? ''}
              placeholder="Brief summary…"
              className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none resize-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          {/* Rich text editor */}
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1">Content</label>
            <RichTextEditor name="content" defaultValue={article.content ?? ''} />
          </div>

          {/* Workflow tip */}
          {article.status === 'draft' && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-amber-400/80">
                Save your changes first, then click <strong>&quot;Submit for Review&quot;</strong> to send to an admin for approval.
              </p>
            </div>
          )}

          {/* Actions */}
          {isEditable && (
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3">
              <Link href="/editor/articles"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-white/8 font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-colors text-center text-sm">
                Discard
              </Link>
              <button type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] text-black font-bold hover:bg-[#ffed4a] transition-colors shadow-lg shadow-[var(--color-primary)]/20 text-sm">
                Save Changes
              </button>
            </div>
          )}
        </form>

        {/* Submit for review — separate form, only for drafts */}
        {article.status === 'draft' && (
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <form action={submitForReviewAction}>
              <input type="hidden" name="id" value={article.id} />
              <button type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 font-bold text-sm hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Submit for Review
              </button>
            </form>
            <p className="text-[11px] text-white/20 text-center mt-2">An admin will review and publish your article.</p>
          </div>
        )}
      </div>
    </div>
  );
}
