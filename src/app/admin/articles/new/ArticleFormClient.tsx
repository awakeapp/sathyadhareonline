'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, Sparkles } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditorClient';
import { PresenceCard } from '@/components/PresenceUI';

interface ArticleFormClientProps {
  categories: { id: string; name: string }[] | null;
  role: string;
  onSubmit: (formData: FormData) => Promise<void>;
  defaultAuthorName: string;
}

export default function ArticleFormClient({ categories, role, onSubmit, defaultAuthorName }: ArticleFormClientProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);

  const displayedSlug = isSlugManual ? slug : title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return (
    <PresenceCard className="p-0 overflow-hidden">
      <form action={onSubmit} encType="multipart/form-data" className="p-10 space-y-10">

        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Narrative Headline</label>
          <input 
            required 
            name="title" 
            type="text" 
            placeholder="The Core Statement..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-16 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-md font-bold shadow-inner" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Network Slug</label>
            <input 
              required 
              name="slug" 
              type="text" 
              placeholder="article-slug-vector"
              value={displayedSlug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManual(true);
              }}
              className="w-full h-14 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none font-mono text-xs font-bold shadow-inner text-indigo-400" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Author Identity</label>
            <input 
              required 
              name="author_name" 
              type="text" 
              placeholder="Display Name" 
              defaultValue={defaultAuthorName}
              className="w-full h-14 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Network Category</label>
            <select name="category_id"
              className="w-full h-16 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-xs font-black uppercase tracking-widest shadow-inner accent-[#5c4ae4]">
              <option value="">Detached Segment</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Visual Identifier (Cover)</label>
            <input name="cover_image" type="file" accept="image/*"
              className="w-full h-16 px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none shadow-inner text-xs font-black text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 file:text-white file:text-[10px] file:uppercase file:tracking-widest" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Manifest Overview (Excerpt)</label>
          <textarea required name="excerpt" rows={3} placeholder="Condensed narrative summary..."
            className="w-full p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border-none text-md font-bold shadow-inner resize-none leading-relaxed" />
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
             <Sparkles className="w-4 h-4" strokeWidth={1.25} /> Core Content Stream
          </label>
          <div className="min-h-[600px] rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
             <RichTextEditor name="content" />
          </div>
        </div>

        <div className="pt-10 border-t border-indigo-50 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-4">
          <Link href="/admin/articles"
            className="h-16 px-10 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-black text-[11px] uppercase tracking-widest text-zinc-500 flex items-center justify-center hover:bg-gray-100 transition-all">
            Cancel
          </Link>
          
          <button 
            type="submit" 
            name="action_type" 
            value="draft"
            className="h-16 px-8 rounded-2xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border-2 border-indigo-50 font-black text-[10px] uppercase tracking-widest hover:border-zinc-900 dark:border-white transition-all"
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
              className="h-16 px-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
            >
              <Send className="w-5 h-5" strokeWidth={1.25} /> Deploy Broadcast
            </button>
          )}
        </div>
        
      </form>
    </PresenceCard>
  );
}
