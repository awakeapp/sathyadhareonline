'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, ArrowLeft, CheckCircle, Clock, Save } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditorClient';

interface ArticleFormClientProps {
  categories: { id: string; name: string }[] | null;
  users: { id: string; name: string }[];
  role: string;
  onSubmit: (formData: FormData) => Promise<void>;
  currentUserId: string;
}

export default function ArticleFormClient({ categories, users, role, onSubmit, currentUserId }: ArticleFormClientProps) {
  const [stage, setStage] = useState<'metadata' | 'editor'>('metadata');
  
  // Form State
  const [title, setTitle] = useState('');
  const [slug] = useState('');
  const [isSlugManual] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const displayedSlug = isSlugManual ? slug : title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  const handleContinue = () => {
    if (!title.trim()) {
        alert("Article title is required.");
        return;
    }
    setStage('editor');
  };

  return (
    <form action={onSubmit} encType="multipart/form-data" className="w-full h-full flex flex-col">
      {/* ── STAGE 1: METADATA FORM ── */}
      <div className={stage === 'metadata' ? 'block w-full max-w-3xl mx-auto p-4 md:p-8 pt-6 md:pt-12 animate-in fade-in' : 'hidden'}>
         <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">New Article</h1>
            <p className="text-[var(--color-muted)] mt-2">Initialize document metadata before writing.</p>
         </div>

         <div className="bg-[var(--color-surface)] shadow-sm rounded-2xl p-6 md:p-8 border border-[var(--color-border)] space-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[var(--color-text)]">Article Title *</label>
              <input 
                required 
                name="title" 
                type="text" 
                placeholder="Enter an engaging title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[15px] font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" 
              />
            </div>

            <div className="hidden">
              <input name="slug" value={displayedSlug} readOnly />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[var(--color-text)]">Author *</label>
                <select 
                  required
                  name="author_id" 
                  defaultValue={currentUserId}
                  className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[14px] font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Select Author</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[var(--color-text)]">Category *</label>
                <select 
                  required
                  name="category_id"
                  className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[14px] font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all appearance-none"
                >
                  <option value="" disabled selected>Select Category</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[var(--color-text)]">Cover Image (Optional)</label>
              <div className="relative">
                <input 
                  name="cover_image" 
                  type="file" 
                  accept="image/*"
                  className="w-full h-12 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[13px] text-[var(--color-muted)] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[var(--color-surface)] file:text-[var(--color-text)] hover:file:bg-[var(--color-border)] transition-all cursor-pointer" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[var(--color-text)]">Article Summary (Optional)</label>
              <textarea 
                name="excerpt" 
                rows={3} 
                placeholder="A short description of the article..."
                className="w-full p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[14px] leading-relaxed focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none" 
              />
            </div>
         </div>

         <div className="flex items-center justify-end gap-3 mt-8 pb-10">
            <Link href="/admin/articles" className="px-6 py-2.5 rounded-xl font-semibold text-[14px] text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
              Cancel
            </Link>
            <button 
              type="button" 
              onClick={handleContinue}
              className="px-8 py-2.5 rounded-xl font-semibold text-[14px] text-white bg-[var(--color-primary)] hover:opacity-90 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all active:scale-95"
            >
              Continue
            </button>
         </div>
      </div>

      {/* ── STAGE 2: FULL SCREEN EDITOR ── */}
      <div className={stage === 'editor' ? 'fixed inset-0 z-[100] bg-[var(--color-surface)] flex flex-col w-full h-full animate-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
        
        {/* Editor Header */}
        <header className="h-[60px] shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-4 w-full">
           <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
             <button type="button" onClick={() => setStage('metadata')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shrink-0">
               <ArrowLeft className="w-5 h-5" strokeWidth={2} />
             </button>
             <div className="min-w-0 pr-4">
               <h2 className="text-[15px] md:text-[16px] font-bold text-[var(--color-text)] truncate">{title || 'Untitled Article'}</h2>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-[11px] font-medium text-[var(--color-muted)]">Draft Unsaved</span>
               </div>
             </div>
           </div>
           
           <div className="hidden md:flex items-center gap-4 shrink-0 px-4">
              <span className="text-[12px] font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] px-3 py-1 rounded-full">Editorial Canvas</span>
           </div>
        </header>

        {/* Editor Canvas */}
        <main className="flex-1 overflow-y-auto w-full bg-[var(--color-surface-2)]/30">
           <div className="max-w-4xl mx-auto w-full min-h-full bg-[var(--color-surface)] p-6 md:p-12 md:my-8 md:rounded-3xl shadow-sm border border-[var(--color-border)] md:min-h-[800px]">
              <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--color-text)] tracking-tight mb-8 leading-tight">{title || 'Untitled Article'}</h1>
              <div className="prose-xl prose-zinc dark:prose-invert max-w-none">
                 <RichTextEditor name="content" />
              </div>
           </div>
        </main>

        {/* Editor Actions Bottom Bar */}
        <footer className="h-auto min-h-[72px] shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-3 md:px-6 py-3 w-full">
           <div className="text-[13px] font-medium text-[var(--color-muted)] hidden lg:block">
              Ready to publish?
           </div>
           
           <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto justify-between lg:justify-end overflow-x-auto hide-scrollbar whitespace-nowrap">
              
              <button 
                type="submit" 
                name="action_type" 
                value="draft"
                className="shrink-0 h-11 px-4 md:px-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-[13px] hover:bg-[var(--color-border)] transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save Draft</span>
              </button>

              {role === 'editor' ? (
                <button 
                  type="submit" 
                  name="action_type" 
                  value="submit"
                  className="shrink-0 h-11 px-6 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold text-[14px] shadow-sm transition-opacity flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Submit for Review
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  {showDatePicker && (
                    <input type="datetime-local" name="schedule_date" required className="h-11 px-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)] outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                  <button 
                    type={showDatePicker ? "submit" : "button"} 
                    name="action_type" 
                    value="schedule"
                    onClick={() => { if(!showDatePicker) setShowDatePicker(true); }}
                    className={`shrink-0 h-11 px-4 md:px-5 rounded-xl border font-semibold text-[13px] transition-all flex items-center gap-2 ${showDatePicker ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-500/10'}`}
                  >
                    <Clock className="w-4 h-4" /> {showDatePicker ? 'Confirm Schedule' : <span className="hidden sm:inline">Schedule</span>}
                  </button>
                  <button 
                    type="submit" 
                    name="action_type" 
                    value="publish"
                    className="shrink-0 h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[14px] rounded-xl shadow-[0_2px_10px_0_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Publish Now
                  </button>
                </div>
              )}
           </div>
        </footer>

      </div>
    </form>
  );
}
