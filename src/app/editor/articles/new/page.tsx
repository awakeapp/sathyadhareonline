import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { Send, Sparkles } from 'lucide-react';
import sharp from 'sharp';
import AdminContainer from '@/components/layout/AdminContainer';

export const dynamic = 'force-dynamic';

export default async function EditorNewArticlePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/sign-in');

  const authorName = profile.full_name ?? 'Editor';

  const { data: categories } = await supabase
    .from('categories').select('id, name').order('name');

  async function createArticleAction(formData: FormData) {
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

    const { data: inserted, error: insertError } = await sb
      .from('articles')
      .insert({
        title,
        slug,
        excerpt,
        content,
        category_id: category_id || null,
        status: 'draft',
        author_id:   actionUser.id,
        author_name,
      })
      .select('id')
      .single();

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
      const { error: uploadError } = await sb.storage
        .from('article-images')
        .upload(path, compressedBuffer, { upsert: true, contentType: 'image/webp' });

      if (!uploadError) {
        const { data: urlData } = sb.storage.from('article-images').getPublicUrl(path);
        await sb.from('articles').update({ cover_image: urlData.publicUrl }).eq('id', inserted.id);
      }
    }

    redirect('/editor/articles');
  }

  return (
    <AdminContainer className="flex flex-col gap-6 pb-6">

      {/* Page heading with inline save button */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Write</h1>
          <p className="text-[12px] text-[var(--color-muted)] mt-0.5">New article draft</p>
        </div>
        <button
          type="submit"
          form="editor-article-form"
          className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-[var(--color-primary)] text-white font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all"
        >
          <Send size={14} />
          Save Draft
        </button>
      </div>

      <form id="editor-article-form" action={createArticleAction} encType="multipart/form-data" className="flex flex-col gap-5">

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Title</label>
          <input
            required name="title" type="text" placeholder="Article title…"
            className="w-full h-14 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">URL Slug</label>
            <input
              required name="slug" type="text" placeholder="article-url-slug"
              className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[13px] text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Author Name</label>
            <input
              required name="author_name" type="text" defaultValue={authorName}
              className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Category</label>
            <select
              name="category_id"
              className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">Uncategorized</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Cover Image</label>
            <input
              name="cover_image" type="file" accept="image/*"
              className="w-full h-12 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12px] text-[var(--color-muted)] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:text-white file:text-[10px] file:font-bold file:uppercase file:tracking-wider"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Excerpt</label>
          <textarea
            required name="excerpt" rows={3} placeholder="Brief summary of the article…"
            className="w-full p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] resize-none leading-relaxed focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2">
            <Sparkles size={13} /> Article Body
          </label>
          <div className="min-h-[500px] rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
            <RichTextEditor name="content" />
          </div>
        </div>

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
            <Send size={15} /> Save Draft
          </button>
        </div>
      </form>
    </AdminContainer>
  );
}
