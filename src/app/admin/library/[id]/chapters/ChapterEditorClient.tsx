'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Send, CheckCircle, Sparkles } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditorClient';

interface Props {
  bookId: string;
  chapter?: {
    id: string;
    title: string;
    content: string;
    status: string;
  };
  role: string;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function ChapterEditorClient({ bookId, chapter, role, onSubmit }: Props) {
  const [title, setTitle] = useState(chapter?.title || '');
  const [stage, setStage] = useState<'metadata' | 'editor'>(chapter ? 'editor' : 'metadata');

  return (
    <form action={onSubmit} className="w-full h-full flex flex-col min-h-screen bg-[var(--color-surface-2)]">
      
      {/* Stage 1: Title Input */}
      <div className={stage === 'metadata' ? 'block w-full max-w-2xl mx-auto pt-20 px-6 animate-in fade-in' : 'hidden'}>
         <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-[var(--color-text)] uppercase tracking-tight">New Chapter</h1>
            <p className="text-[var(--color-muted)] mt-2 font-medium">Give your book chapter a compelling title.</p>
         </div>

         <div className="bg-[var(--color-surface)] p-10 rounded-[2.5rem] shadow-xl border border-[var(--color-border)]">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-4">Chapter Title</label>
            <input 
              required
              name="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: The Beginning"
              className="w-full h-16 px-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none text-xl font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            
            <div className="flex gap-4 mt-10">
               <Link href={`/admin/library/${bookId}/chapters`} className="flex-1 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center">Cancel</Link>
               <button 
                 type="button" 
                 onClick={() => { if(title.trim()) setStage('editor'); }}
                 className="flex-3 h-14 px-12 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20"
               >
                 Continue to Write
               </button>
            </div>
         </div>
      </div>

      {/* Stage 2: Rich Editor */}
      <div className={stage === 'editor' ? 'fixed inset-0 z-[100] bg-[var(--color-surface)] flex flex-col w-full h-full animate-in slide-in-from-bottom-4' : 'hidden'}>
        <header className="h-[72px] shrink-0 border-b border-[var(--color-border)] px-4 flex items-center justify-between bg-[var(--color-surface)] sticky top-0 z-50">
           <div className="flex items-center gap-4 min-w-0">
              <button 
                type="button" 
                onClick={() => setStage('metadata')}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 text-zinc-400 min-w-[44px] min-h-[44px]"
              >
                 <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                 <h2 className="text-sm font-black uppercase tracking-tight truncate">{title || 'Untitled Chapter'}</h2>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase">Drafting Chapter</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <button 
                type="submit" 
                name="status" 
                value="draft"
                className="h-10 px-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-600 font-black text-[10px] uppercase tracking-widest border border-zinc-200"
              >
                 Save Draft
              </button>
              
              {role === 'editor' ? (
                <button 
                  type="submit" 
                  name="status" 
                  value="in_review"
                  className="h-10 px-6 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md"
                >
                   Submit Review
                </button>
              ) : (
                <button 
                  type="submit" 
                  name="status" 
                  value="published"
                  className="h-10 px-6 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md"
                >
                   Publish Now
                </button>
              )}
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 p-4 md:p-8">
           <div className="max-w-4xl mx-auto bg-[var(--color-surface)] min-h-[800px] shadow-2xl rounded-[3rem] p-10 md:p-16 border border-[var(--color-border)]">
              <input name="title" value={title} className="hidden" readOnly />
              <h1 className="text-4xl md:text-5xl font-black text-[var(--color-text)] mb-10 leading-tight uppercase tracking-tight">{title || 'Untitled Chapter'}</h1>
              <div className="prose prose-xl prose-zinc dark:prose-invert max-w-none">
                 <RichTextEditor name="content" defaultValue={chapter?.content || ''} />
              </div>
           </div>
        </main>
      </div>

    </form>
  );
}
