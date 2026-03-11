import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';

export default async function NewArticlePage() {
  const supabase = await createClient();

  // Determine user role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
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
      .single();
    const actionRole = actionProfile?.role || 'reader';

    // Role-based status determination
    let status = 'draft';
    if (actionRole === 'editor') {
      if (action_type === 'submit') status = 'in_review';
    } else if (['admin', 'super_admin'].includes(actionRole)) {
      if (action_type === 'publish') status = 'published';
      else if (action_type === 'submit') status = 'in_review';
    }

    // Insert article first to get the ID
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
      .single();

    if (insertError || !inserted) {
      console.error('Error inserting article:', insertError);
      return;
    }

    // Upload cover image if provided
    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split('.').pop();
      const path = `articles/${inserted.id}/cover.${ext}`;
      const { error: uploadError } = await supabaseAction.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabaseAction.storage
          .from('article-images')
          .getPublicUrl(path);

        await supabaseAction
          .from('articles')
          .update({ cover_image: urlData.publicUrl })
          .eq('id', inserted.id);
      } else {
        console.error('Cover upload error:', uploadError);
      }
    }

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
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Article</h1>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
          <form action={createArticleAction} encType="multipart/form-data" className="p-6 md:p-8 space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="title">Title</label>
              <input required id="title" name="title" type="text" placeholder="The Title of Your Article"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="slug">Slug URL</label>
                <input required id="slug" name="slug" type="text" placeholder="article-slug"
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none font-mono text-sm" />
              </div>

              {/* Author Name */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="author_name">Author</label>
                <input required id="author_name" name="author_name" type="text" placeholder="Display Author"
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="category_id">Category</label>
                <div className="relative">
                  <select id="category_id" name="category_id"
                    className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none appearance-none">
                    <option value="" className="bg-[#181623]">Select Category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#181623]">{cat.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--color-muted)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="cover_image">
                  Cover <span className="font-normal opacity-50 capitalize lowercase">(optional)</span>
                </label>
                <input id="cover_image" name="cover_image" type="file" accept="image/*"
                  className="w-full text-sm text-[var(--color-muted)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] file:font-semibold hover:file:bg-[var(--color-primary)]/20 transition-all bg-black/20 border border-[var(--color-border)] rounded-2xl py-1 px-1 cursor-pointer" />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="excerpt">Excerpt</label>
              <textarea required id="excerpt" name="excerpt" rows={3} placeholder="Brief summary of the article..."
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none resize-none leading-relaxed" />
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Content</label>
              <RichTextEditor name="content" />
            </div>

            {/* Actions */}
            <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-end gap-3">
              <Link href="/admin/articles"
                className="w-full px-6 py-4 rounded-2xl border border-[var(--color-border)] font-semibold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-colors text-center">
                Cancel
              </Link>
              
              <button 
                type="submit" 
                name="action_type" 
                value="draft"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-[var(--color-border)] text-white font-bold hover:bg-white/10 transition-colors text-center"
              >
                Save Draft
              </button>

              {role === 'editor' ? (
                <button 
                  type="submit" 
                  name="action_type" 
                  value="submit"
                  className="w-full px-8 py-4 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 text-center"
                >
                  Submit for Review
                </button>
              ) : (
                <button 
                  type="submit" 
                  name="action_type" 
                  value="publish"
                  className="w-full px-8 py-4 rounded-2xl bg-[var(--color-primary)] text-black font-bold hover:bg-[#ffed4a] transition-colors shadow-lg shadow-[var(--color-primary)]/20 text-center"
                >
                  Publish Now
                </button>
              )}
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
