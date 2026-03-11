import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { ChevronLeft, Bell, PenTool, Sparkles, Send, Box, FileText } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
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
      .single();

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

    redirect('/admin/articles');
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Article Weaver · Creation Matrix"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin/articles"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        
        <div className="flex items-center gap-5 mb-6">
           <div className="w-12 h-12 rounded-2xl bg-[#5c4ae4] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <FileText className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Birth of Narrative</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Initializing new document sequence</p>
           </div>
        </div>

        <PresenceCard className="p-0 overflow-hidden">
          <form action={createArticleAction} encType="multipart/form-data" className="p-10 space-y-10">

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Narrative Headline</label>
              <input required name="title" type="text" placeholder="The Core Statement..."
                className="w-full h-16 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Network Slug</label>
                <input required name="slug" type="text" placeholder="article-slug-vector"
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none font-mono text-xs font-bold shadow-inner text-indigo-400" />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Author Identity</label>
                <input required name="author_name" type="text" placeholder="Dispaly Identity" defaultValue={profile?.full_name || ''}
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-bold shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Network Category</label>
                <select name="category_id"
                  className="w-full h-16 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-xs font-black uppercase tracking-widest shadow-inner accent-[#5c4ae4]">
                  <option value="">Detached Segment</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Visual Identifier (Cover)</label>
                <input name="cover_image" type="file" accept="image/*"
                  className="w-full h-16 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none shadow-inner text-xs font-black text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#5c4ae4] file:text-white file:text-[10px] file:uppercase file:tracking-widest" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Manifest Overview (Excerpt)</label>
              <textarea required name="excerpt" rows={3} placeholder="Condensed narrative summary..."
                className="w-full p-6 rounded-[2rem] bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner resize-none leading-relaxed" />
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4] flex items-center gap-3">
                 <Sparkles className="w-4 h-4" /> Core Content Stream
              </label>
              <div className="min-h-[600px] rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white dark:bg-[#1b1929]">
                 <RichTextEditor name="content" />
              </div>
            </div>

            <div className="pt-10 border-t border-indigo-50 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-4">
              <Link href="/admin/articles"
                className="h-16 px-10 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-black text-[11px] uppercase tracking-widest text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all">
                Cancel
              </Link>
              
              <button 
                type="submit" 
                name="action_type" 
                value="draft"
                className="h-16 px-8 rounded-2xl bg-white dark:bg-[#1b1929] text-[#1b1929] dark:text-white border-2 border-indigo-50 font-black text-[10px] uppercase tracking-widest hover:border-[#5c4ae4] transition-all"
              >
                Save Cold Draft
              </button>

              {role === 'editor' ? (
                <button 
                  type="submit" 
                  name="action_type" 
                  value="submit"
                  className="h-16 px-10 rounded-2xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Submit for Audit
                </button>
              ) : (
                <button 
                  type="submit" 
                  name="action_type" 
                  value="publish"
                  className="h-16 px-12 bg-[#5c4ae4] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                >
                  <Send className="w-5 h-5" /> Deploy Broadcast
                </button>
              )}
            </div>
            
          </form>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
