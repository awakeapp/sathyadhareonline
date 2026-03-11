import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditorClient';
import { CoverImageUpload } from './CoverImageUpload';
import { Star, ChevronLeft, Bell, PenTool, Sparkles, Send } from 'lucide-react';
import { logAuditEvent } from '@/lib/audit';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
} from '@/components/PresenceUI';

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

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  const role = profile?.role || 'reader';

  // Fetch article data
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category_id, status, cover_image, is_featured, published_at')
    .eq('id', id)
    .single();

  if (articleError || !article) {
    notFound();
    return null; 
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
    
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;
    const { data: actionProfile } = await supabaseAction.from('profiles').select('role').eq('id', actionUser.id).single();
    const actionRole = actionProfile?.role || 'reader';

    let targetStatus = formData.get('status') as string;

    if (actionRole === 'editor' && ['published', 'archived'].includes(targetStatus)) {
      targetStatus = 'in_review'; 
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
                      : (targetStatus !== 'published' ? null : article?.published_at),
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

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Article Weaver · Data Mutation"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin/articles"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        
        {/* State Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4]">
                 <PenTool className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Edit Narrative</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Registry-ID: {id.slice(0, 8)}</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                article.status === 'published' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-500' 
                  : article.status === 'in_review'
                  ? 'bg-amber-50 border-amber-100 text-amber-500'
                  : 'bg-orange-50 border-orange-100 text-orange-500'
              }`}>
                {article.status.replace('_', ' ')}
              </span>
              {['admin', 'super_admin'].includes(role) && article.status !== 'published' && (
                <form action={publishNowAction}>
                  <button type="submit" className="h-10 px-6 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                     <Send className="w-4 h-4" /> Publish Now
                  </button>
                </form>
              )}
           </div>
        </div>

        <PresenceCard className="p-0 overflow-hidden">
          <form action={updateArticleAction} encType="multipart/form-data" className="p-10 space-y-10">
            
            {['admin', 'super_admin'].includes(role) && (
              <div className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${
                article.is_featured ? 'border-[#5c4ae4] bg-indigo-50/50' : 'border-indigo-50 bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${article.is_featured ? 'bg-[#5c4ae4] text-white shadow-lg shadow-indigo-500/50' : 'bg-white text-gray-300 shadow-sm'}`}>
                    <Star className="w-6 h-6" fill={article.is_featured ? "currentColor" : "none"} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Highlight Priority</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Prime Visibility Allocation</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_featured" defaultChecked={article.is_featured ?? false} className="sr-only peer" />
                  <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:bg-[#5c4ae4] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6" />
                </label>
              </div>
            )}

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
                    <input name="title" required defaultValue={article.title} placeholder="The Core Statement..." className="w-full h-16 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Network Slug</label>
                      <input name="slug" required defaultValue={article.slug} className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none font-mono text-xs font-bold shadow-inner text-indigo-400" />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Protocol Status</label>
                      <select name="status" defaultValue={article.status} className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-xs font-black uppercase tracking-widest shadow-inner accent-[#5c4ae4]">
                        {role === 'editor' ? (
                          <>
                            <option value="draft">Cold Draft</option>
                            <option value="in_review">Awaiting Audit</option>
                          </>
                        ) : (
                          <>
                            <option value="draft">Cold Draft</option>
                            <option value="in_review">Awaiting Audit</option>
                            <option value="published">Broadcast Live</option>
                            <option value="archived">Deep Storage</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Network Category</label>
              <select name="category_id" defaultValue={article.category_id ?? ''} className="w-full h-16 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-xs font-black uppercase tracking-widest shadow-inner">
                <option value="">Detached Segment</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Manifest Overview (Excerpt)</label>
              <textarea name="excerpt" rows={3} defaultValue={article.excerpt ?? ''} placeholder="Condensed narrative summary..." className="w-full p-6 rounded-[2rem] bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner resize-none leading-relaxed" />
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4] flex items-center gap-3">
                 <Sparkles className="w-4 h-4" /> Core Content Stream
              </label>
              <div className="min-h-[600px] rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white dark:bg-[#1b1929]">
                 <RichTextEditor name="content" defaultValue={article.content ?? ''} />
              </div>
            </div>

            <div className="pt-10 border-t border-indigo-50 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-4">
              <Link href="/admin/articles" className="h-16 px-10 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-black text-[11px] uppercase tracking-widest text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all">Discard Mutation</Link>
              <button type="submit" className="h-16 px-12 bg-[#5c4ae4] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                Synchronize Article
              </button>
            </div>
            
          </form>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
