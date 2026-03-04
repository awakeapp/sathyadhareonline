import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { CoverImageUpload } from './CoverImageUpload';

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

  // Fetch article data
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category_id, status, cover_image, is_featured')
    .eq('id', id)
    .single();

  if (articleError || !article) notFound();

  // Fetch categories for dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  // Server Action: Update Article
  async function updateArticleAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const title       = formData.get('title') as string;
    const slug        = formData.get('slug') as string;
    const excerpt     = formData.get('excerpt') as string;
    const content     = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    const status      = formData.get('status') as string;
    const is_featured = formData.get('is_featured') === 'on';
    const coverFile   = formData.get('cover_image') as File | null;

    const updateData: Record<string, unknown> = {
      title,
      slug,
      excerpt,
      content,
      category_id: category_id || null,
      status: status === 'published' ? 'published' : 'draft',
      is_featured,
      updated_at: new Date().toISOString(),
    };

    // If featuring this article, un-feature all others first
    if (is_featured) {
      await supabaseAction.from('articles').update({ is_featured: false }).neq('id', id);
    }

    // Handle Cover Image Upload
    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split('.').pop();
      const path = `articles/${id}/cover.${ext}`;
      
      const { error: uploadError } = await supabaseAction.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });

      if (!uploadError) {
        const { data: urlData } = supabaseAction.storage
          .from('article-images')
          .getPublicUrl(path);
        
        // Bust cache with timestamp
        const ts = new Date().getTime();
        updateData.cover_image = `${urlData.publicUrl}?t=${ts}`;
      } else {
        console.error('Storage upload error:', uploadError);
      }
    }

    const { error } = await supabaseAction
      .from('articles')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Update failed:', error);
      return;
    }

    revalidatePath('/admin/articles');
    revalidatePath(`/articles/${slug}`);
    revalidatePath('/');
    redirect('/admin/articles');
  }


  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/articles" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Edit Article</h1>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              article.status === 'published' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
            }`}>
              {article.status}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
          <form action={updateArticleAction} encType="multipart/form-data" className="p-6 md:p-8 space-y-6">
            
            {/* Featured Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              article.is_featured
                ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] bg-black/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`text-xl transition-all ${article.is_featured ? 'scale-110 drop-shadow-md text-[var(--color-primary)]' : 'grayscale opacity-40'}`}>
                  ⭐
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">
                    Feature on Homepage
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Displays as hero banner.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={article.is_featured ?? false}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] border border-white/5" />
              </label>
            </div>

            {/* Cover Image Section */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Cover Image</label>
              <div className="bg-black/20 border border-[var(--color-border)] rounded-2xl p-2">
                <CoverImageUpload currentImageUrl={article.cover_image} />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Headline</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={article.title}
                placeholder="Enter article headline..."
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">URL Slug</label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  defaultValue={article.slug}
                  placeholder="article-url-path"
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none font-mono text-sm"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Visibility</label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    defaultValue={article.status}
                    className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="draft" className="bg-[#181623]">Save as Draft</option>
                    <option value="published" className="bg-[#181623]">Publish (Live)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--color-muted)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Categorization</label>
              <div className="relative">
                <select
                  id="category_id"
                  name="category_id"
                  defaultValue={article.category_id ?? ''}
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none appearance-none"
                >
                  <option value="" className="bg-[#181623]">Uncategorized Collection</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#181623]">{cat.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--color-muted)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Brief Summary</label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                defaultValue={article.excerpt ?? ''}
                placeholder="What is this article about? (Used for previews)"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Content Container Setup */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Main Narrative</label>
              <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-white prose-editor-container">
                <RichTextEditor name="content" defaultValue={article.content ?? ''} />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-end gap-3">
              <Link
                href="/admin/articles"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-[var(--color-border)] font-semibold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-colors text-center"
              >
                Discard
              </Link>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--color-primary)] text-black font-bold hover:bg-[#ffed4a] transition-colors shadow-lg shadow-[var(--color-primary)]/20 text-center"
              >
                Save Changes
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
