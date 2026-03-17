import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { CoverImageUpload } from '@/app/admin/articles/[id]/edit/CoverImageUpload';
import sharp from 'sharp';
import { Send, AlertTriangle, Check, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',        color: '#94a3b8' },
  in_review: { label: 'In Review',    color: '#f59e0b' },
  published: { label: 'Published',    color: '#10b981' },
  archived:  { label: 'Archived',     color: '#8b5cf6' },
};

export default async function EditorEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/sign-in');

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category_id, status, cover_image, author_id, author_name')
    .eq('id', id)
    .single();

  if (error || !article) notFound();

  // Editors can ONLY edit articles assigned to them
  if (article.author_id !== user.id) {
    redirect('/editor/articles');
  }

  const isEditable = ['draft', 'in_review'].includes(article.status ?? '');

  const { data: categories } = await supabase
    .from('categories').select('id, name').order('name');

  async function updateAction(formData: FormData) {
    'use server';
    const sb = await createClient();
    const { data: { user: actionUser } } = await sb.auth.getUser();
    if (!actionUser) return;

    const title       = formData.get('title') as string;
    const slug        = formData.get('slug') as string;
    const excerpt     = formData.get('excerpt') as string;
    const content     = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    const author_name = formData.get('author_name') as string;
    const coverFile   = formData.get('cover_image') as File | null;

    const updateData: Record<string, unknown> = {
      title, slug, excerpt, content,
      category_id: category_id || null,
      author_name,
      updated_at: new Date().toISOString(),
    };

    if (coverFile && coverFile.size > 0) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const compressedBuffer = await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const path = `articles/${id}/cover.webp`;
      const { error: uploadError } = await sb.storage
        .from('article-images')
        .upload(path, compressedBuffer, { upsert: true, contentType: 'image/webp' });
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

  async function submitForReviewAction(formData: FormData) {
    'use server';
    const sb = await createClient();
    const articleId = formData.get('id') as string;
    await sb.from('articles').update({ status: 'in_review', updated_at: new Date().toISOString() }).eq('id', articleId);
    revalidatePath('/editor/articles');
    redirect('/editor/articles');
  }

  const meta = STATUS_META[article.status ?? 'draft'] || STATUS_META.draft;
  const authorName = profile?.full_name ?? 'Editor';

  return (
    <div className="flex flex-col gap-6 w-full pb-6">

      {/* Page heading */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Edit Article</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ background: `${meta.color}18`, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        </div>
        {isEditable && (
          <button
            type="submit"
            form="editor-edit-form"
            className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-[var(--color-primary)] text-white font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all"
          >
            <Check size={14} />
            Save
          </button>
        )}
      </div>

      {/* Published warning */}
      {!isEditable && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-amber-600 dark:text-amber-400">Read-only</p>
            <p className="text-[12px] text-amber-500/80 mt-0.5">
              This article is {article.status ?? 'published'} and cannot be edited directly.
            </p>
          </div>
        </div>
      )}

      <form id="editor-edit-form" action={updateAction} encType="multipart/form-data" className="flex flex-col gap-5">

        {/* Cover image */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Cover Image</label>
          <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <CoverImageUpload currentImageUrl={article.cover_image} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Title</label>
          <input
            name="title" required disabled={!isEditable} defaultValue={article.title}
            className="w-full h-14 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">URL Slug</label>
            <input
              name="slug" required disabled={!isEditable} defaultValue={article.slug}
              className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[13px] text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Author Name</label>
            <input
              name="author_name" required disabled={!isEditable} defaultValue={article.author_name || authorName}
              className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Category</label>
          <select
            name="category_id" disabled={!isEditable} defaultValue={article.category_id ?? ''}
            className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
          >
            <option value="">Uncategorized</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Excerpt</label>
          <textarea
            name="excerpt" rows={3} disabled={!isEditable} defaultValue={article.excerpt ?? ''}
            className="w-full p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] resize-none leading-relaxed focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2">
            <Sparkles size={13} /> Article Body
          </label>
          <div className="min-h-[500px] rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
            <RichTextEditor name="content" defaultValue={article.content ?? ''} />
          </div>
        </div>

        {isEditable && (
          <div className="flex gap-3 justify-end pt-2">
            <Link
              href="/editor/articles"
              className="h-11 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-bold text-[var(--color-muted)] flex items-center hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="h-11 px-6 bg-[var(--color-primary)] text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Check size={15} /> Save Changes
            </button>
          </div>
        )}
      </form>

      {/* Submit for review — only when in draft */}
      {article.status === 'draft' && (
        <form action={submitForReviewAction}>
          <input type="hidden" name="id" value={article.id} />
          <button
            type="submit"
            className="w-full h-12 bg-amber-500 text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Send size={16} /> Submit for Review
          </button>
          <p className="text-[11px] text-[var(--color-muted)] text-center mt-2">
            Your article will be reviewed by an admin before publishing.
          </p>
        </form>
      )}
    </div>
  );
}
