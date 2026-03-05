import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';

export const dynamic = 'force-dynamic';

export default async function EditorNewArticlePage() {
  const supabase = await createClient();

  // Auth + role guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

  const authorName = profile.full_name ?? 'Editor';

  // Categories for the dropdown
  const { data: categories } = await supabase
    .from('categories').select('id, name').order('name');

  // ── Create article server action ─────────────────────────────────
  async function createArticleAction(formData: FormData) {
    'use server';
    const sb = await createClient();

    // Re-verify caller is an editor
    const { data: { user: actionUser } } = await sb.auth.getUser();
    if (!actionUser) return;

    const { data: actionProfile } = await sb
      .from('profiles').select('role').eq('id', actionUser.id).single();
    if (!actionProfile || actionProfile.role !== 'editor') return;

    const title       = formData.get('title') as string;
    const slug        = formData.get('slug') as string;
    const excerpt     = formData.get('excerpt') as string;
    const content     = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    const author_name = formData.get('author_name') as string;
    const coverFile   = formData.get('cover_image') as File | null;

    // Insert article with author_id set to the editor's user ID
    const { data: inserted, error: insertError } = await sb
      .from('articles')
      .insert({
        title,
        slug,
        excerpt,
        content,
        category_id: category_id || null,
        status: 'draft',          // editors always start in draft
        author_id:   actionUser.id, // always the current user
        author_name,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('Error inserting article:', insertError);
      return;
    }

    // Upload cover image if provided
    if (coverFile && coverFile.size > 0) {
      const ext  = coverFile.name.split('.').pop();
      const path = `articles/${inserted.id}/cover.${ext}`;
      const { error: uploadError } = await sb.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = sb.storage.from('article-images').getPublicUrl(path);
        await sb.from('articles').update({ cover_image: urlData.publicUrl }).eq('id', inserted.id);
      } else {
        console.error('Cover upload error:', uploadError);
      }
    }

    redirect('/editor/articles');
  }

  // ── UI ───────────────────────────────────────────────────────────
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
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Write New Article</h1>
          <p className="text-xs text-white/30 mt-0.5">Saved as Draft · Submit for review when ready</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-[#181623] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <form action={createArticleAction} encType="multipart/form-data" className="p-6 md:p-8 space-y-6">

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="title">
              Title
            </label>
            <input required id="title" name="title" type="text" placeholder="The headline of your article"
              className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none font-bold" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slug */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="slug">
                URL Slug
              </label>
              <input required id="slug" name="slug" type="text" placeholder="article-url-slug"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none font-mono text-sm" />
            </div>
            {/* Author */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="author_name">
                Author Name
              </label>
              <input id="author_name" name="author_name" type="text" defaultValue={authorName}
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="category_id">
                Category
              </label>
              <div className="relative">
                <select id="category_id" name="category_id"
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none appearance-none">
                  <option value="" className="bg-[#181623]">Select Category</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#181623]">{cat.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            {/* Cover image */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="cover_image">
                Cover <span className="font-normal opacity-40 capitalize lowercase">(optional)</span>
              </label>
              <input id="cover_image" name="cover_image" type="file" accept="image/*"
                className="w-full text-sm text-white/40 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-violet-500/15 file:text-violet-400 file:font-semibold hover:file:bg-violet-500/25 transition-all bg-black/20 border border-white/8 rounded-2xl py-1 px-1 cursor-pointer" />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1" htmlFor="excerpt">
              Excerpt
            </label>
            <textarea required id="excerpt" name="excerpt" rows={3} placeholder="A brief summary of your article…"
              className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-white/8 text-white placeholder-white/20 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all outline-none resize-none leading-relaxed" />
          </div>

          {/* Rich text editor */}
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1">Content</label>
            <RichTextEditor name="content" />
          </div>

          {/* Editor workflow note */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs text-amber-400/80">
              Articles are saved as <strong>Draft</strong>. After saving, open the article and click <strong>"Submit for Review"</strong> to send it to an admin for approval and publishing.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3">
            <Link href="/editor/articles"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-white/8 font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-colors text-center text-sm">
              Cancel
            </Link>
            <button type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] text-black font-bold hover:bg-[#ffed4a] transition-colors shadow-lg shadow-[var(--color-primary)]/20 text-sm">
              Save as Draft
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
