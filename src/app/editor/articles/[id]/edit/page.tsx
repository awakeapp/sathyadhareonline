import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { CoverImageUpload } from '@/app/admin/articles/[id]/edit/CoverImageUpload';
import { Send, ChevronLeft, Bell, PenTool, Sparkles, AlertTriangle, Check } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function EditorEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category_id, status, cover_image, author_id')
    .eq('id', id)
    .single();

  if (error || !article) notFound();

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
    const coverFile   = formData.get('cover_image') as File | null;

    const updateData: Record<string, unknown> = {
      title,
      slug,
      excerpt,
      content,
      category_id: category_id || null,
      updated_at:  new Date().toISOString(),
    };

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

  async function submitForReviewAction(formData: FormData) {
    'use server';
    const sb = await createClient();
    const articleId = formData.get('id') as string;
    await sb.from('articles').update({ status: 'in_review', updated_at: new Date().toISOString() }).eq('id', articleId);
    revalidatePath('/editor/articles');
    redirect('/editor/articles');
  }

  const statusColors: Record<string, { label: string; color: string }> = {
    draft:     { label: 'Cold Draft',     color: '#94a3b8' },
    in_review: { label: 'Awaiting Audit', color: '#f59e0b' },
    published: { label: 'Broadcast Live', color: '#10b981' },
    archived:  { label: 'Deep Storage',  color: '#8b5cf6' },
  };

  const meta = statusColors[article.status ?? 'draft'] || statusColors.draft;
  const initials = (profile?.full_name || 'E').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Article Weaver · Narrative Mutation"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/editor/articles"
      />
      
      <div className="px-5 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        
        {/* State Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4]">
                 <PenTool className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Edit Narrative</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Self-Authored Node</p>
              </div>
           </div>

           <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white dark:bg-[#1b1929] border-indigo-50" style={{ color: meta.color }}>
             {meta.label}
           </span>
        </div>

        {!isEditable && (
          <PresenceCard className="bg-amber-50 border-amber-100 p-6 flex items-start gap-4">
             <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
             <div>
                <p className="font-black text-amber-600 uppercase tracking-tight text-sm">Protected Registry</p>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">This document has been finalized or archived. Mutation is restricted.</p>
             </div>
          </PresenceCard>
        )}

        <PresenceCard className="p-0 overflow-hidden">
          <form action={updateAction} encType="multipart/form-data" className="p-10 space-y-10">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-4">
                 <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Visual Identifier (Cover)</label>
                 <div className="bg-gray-50 dark:bg-[#1b1929] rounded-[2rem] p-4 shadow-inner border-none">
                    <CoverImageUpload currentImageUrl={article.cover_image} />
                 </div>
               </div>

               <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Narrative Headline</label>
                    <input name="title" required disabled={!isEditable} defaultValue={article.title} className="w-full h-16 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner disabled:opacity-50" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Network Slug</label>
                      <input name="slug" required disabled={!isEditable} defaultValue={article.slug} className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none font-mono text-xs font-bold shadow-inner text-indigo-400 disabled:opacity-50" />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Network Category</label>
                      <select name="category_id" disabled={!isEditable} defaultValue={article.category_id ?? ''} className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-xs font-black uppercase tracking-widest shadow-inner disabled:opacity-50">
                        <option value="">Detached Segment</option>
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Manifest Overview (Excerpt)</label>
              <textarea name="excerpt" rows={3} disabled={!isEditable} defaultValue={article.excerpt ?? ''} className="w-full p-6 rounded-[2rem] bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner resize-none leading-relaxed disabled:opacity-50" />
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4] flex items-center gap-3">
                 <Sparkles className="w-4 h-4" /> Core Content Stream
              </label>
              <div className="min-h-[600px] rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white dark:bg-[#1b1929]">
                 <RichTextEditor name="content" defaultValue={article.content ?? ''} />
              </div>
            </div>

            {isEditable && (
              <div className="pt-10 border-t border-indigo-50 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-4">
                <Link href="/editor/articles" className="h-16 px-10 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-black text-[11px] uppercase tracking-widest text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all">Discard Mutation</Link>
                <button type="submit" className="h-16 px-12 bg-[#5c4ae4] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Synchronize Article
                </button>
              </div>
            )}
          </form>

          {article.status === 'draft' && (
            <div className="p-10 pt-0">
               <form action={submitForReviewAction}>
                  <input type="hidden" name="id" value={article.id} />
                  <button type="submit" className="w-full h-16 bg-amber-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                     <Send className="w-5 h-5" /> Submit for Audit Registry
                  </button>
               </form>
               <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] text-center mt-6">Awaiting Admin Interception after Submission</p>
            </div>
          )}
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
