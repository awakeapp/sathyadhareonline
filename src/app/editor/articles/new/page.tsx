import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { ChevronLeft, Bell, PenTool, Sparkles, Send, FileText } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function EditorNewArticlePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

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
      const ext  = coverFile.name.split('.').pop();
      const path = `articles/${inserted.id}/cover.${ext}`;
      const { error: uploadError } = await sb.storage
        .from('article-images')
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });

      if (!uploadError) {
        const { data: urlData } = sb.storage.from('article-images').getPublicUrl(path);
        await sb.from('articles').update({ cover_image: urlData.publicUrl }).eq('id', inserted.id);
      }
    }

    redirect('/editor/articles');
  }

  const initials = (profile?.full_name || 'E').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Article Weaver · Creation Matrix"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/editor/articles"
      />
      
      <div className="px-5 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        
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
                <input required name="author_name" type="text" placeholder="Display Identity" defaultValue={authorName}
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
              <Link href="/editor/articles"
                className="h-16 px-10 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-black text-[11px] uppercase tracking-widest text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all">
                Cancel
              </Link>
              <button 
                type="submit" 
                className="h-16 px-12 bg-[#5c4ae4] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
              >
                <Send className="w-5 h-5" /> Save Cold Draft
              </button>
            </div>
          </form>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
