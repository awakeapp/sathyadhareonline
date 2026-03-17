'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  ChevronRight, 
  Pen, 
  Check, 
  Save, 
  Send, 
  Loader2, 
  X,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import ArticleWriteEditor from '@/components/admin/ArticleWriteEditor';
import { toast } from 'sonner';

interface ArticleItem {
  id: string;
  title: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  summary: string;
  body: string;
  coverImage: string;
  sources: string[];
}

interface SequelBundleEditorProps {
  initialData?: {
    id?: string;
    title: string;
    description: string;
    bannerUrl: string;
    categoryId: string;
    publishDate: string;
    articles: ArticleItem[];
  };
  categories: { id: string; name: string }[];
  sequelCategories: { id: string; name: string }[];
  onSave: (data: any, status: 'draft' | 'published' | 'in_review') => Promise<{ success: boolean; id?: string }>;
  role: 'super_admin' | 'admin' | 'editor';
  onBack: () => void;
}

export default function SequelBundleEditor({
  initialData,
  categories,
  sequelCategories,
  onSave,
  role,
  onBack
}: SequelBundleEditorProps) {
  // --- Sequel State ---
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  
  // Publish Date Handling (Month & Year)
  const [publishDate, setPublishDate] = useState(() => {
    if (initialData?.publishDate) return new Date(initialData.publishDate);
    return new Date();
  });

  // --- Articles State ---
  const [articles, setArticles] = useState<ArticleItem[]>(initialData?.articles || []);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [selectedCategoryForNew, setSelectedCategoryForNew] = useState('');

  // --- UI State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Helpers
  const currentMonth = publishDate.toLocaleString('default', { month: 'long' });
  const currentYear = publishDate.getFullYear();

  const handleAddArticleClick = () => {
    setIsAddingArticle(true);
  };

  const confirmCategorySelection = () => {
    if (!selectedCategoryForNew) {
      toast.error('Choose a category first');
      return;
    }
    const catName = categories.find(c => c.id === selectedCategoryForNew)?.name || 'Article';
    const newId = `new-${Date.now()}`;
    const newArticle: ArticleItem = {
      id: newId,
      title: '',
      authorName: '',
      categoryId: selectedCategoryForNew,
      categoryName: catName,
      summary: '',
      body: '',
      coverImage: '',
      sources: []
    };
    setArticles([...articles, newArticle]);
    setEditingArticleId(newId);
    setIsAddingArticle(false);
    setSelectedCategoryForNew('');
  };

  const handleArticleUpdate = (articleId: string, data: any) => {
    setArticles(articles.map(a => {
      if (a.id === articleId) {
        return {
          ...a,
          title: data.title,
          authorName: data.authorName,
          categoryId: data.categoryId,
          categoryName: categories.find(c => c.id === data.categoryId)?.name || a.categoryName,
          summary: data.summary,
          body: data.body,
          sources: data.sources || [],
          coverImage: data.coverImage
        };
      }
      return a;
    }));
    setEditingArticleId(null);
  };

  const removeArticle = (id: string) => {
    if (confirm('Acknowledge: This content will be removed from the bundle. Proceed?')) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const handleFinalSave = async (status: 'draft' | 'published' | 'in_review') => {
    if (!title.trim()) return toast.error('Bundle Title Missing');
    if (articles.length === 0) return toast.error('Bundle cannot be empty. Add at least one article.');

    setIsSubmitting(true);
    setSaveState('saving');

    const payload = {
      title,
      description,
      bannerUrl,
      categoryId,
      publishDate: publishDate.toISOString(),
      articles: articles.map(a => ({
        ...a,
        status: status // All articles in the bundle share the sequel status or logic
      }))
    };

    try {
      const res = await onSave(payload, status);
      if (res.success) {
        setSaveState('saved');
        toast.success(`Bundle ${status === 'published' ? 'Published' : 'Saved'}`);
        // Optionally redirect or keep on page
      } else {
        setSaveState('idle');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to preserve bundle');
      setSaveState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = role === 'super_admin' || role === 'admin';

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-32">
      {/* --- PREMIUM HEADER --- */}
      <header className="sticky top-0 z-[60] bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">Sequel Builder</h1>
            <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest leading-none">
              Season Bundle Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveState === 'saving' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Syncing
            </div>
          )}
          {saveState === 'saved' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
              <Check size={12} /> Registry Updated
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* --- SECTION 1: SEQUEL DETAILS --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[var(--color-primary)] rounded-full" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Issue Branding</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cover Upload / URL area */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] rounded-[2rem] bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] relative overflow-hidden group">
                {bannerUrl ? (
                  <>
                    <img src={bannerUrl} alt="Cover" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setBannerUrl('')}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                      <ImageIcon size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest">Issue Cover</p>
                      <p className="text-[10px] text-[var(--color-muted)] font-bold mt-1">Paste URL or Drag Image</p>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Image URL..." 
                      className="w-full h-10 px-4 rounded-xl bg-[var(--color-surface-2)] border-none text-xs font-bold"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] ml-1">Sequel Name / Volume Title</label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Eid Al Adha Special Edition"
                  className="w-full h-16 px-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xl font-black focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] ml-1">Release Schedule</label>
                  <div className="flex items-center gap-2 h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold">
                    <Calendar size={18} className="text-[var(--color-primary)]" />
                    <select 
                      className="bg-transparent border-none focus:ring-0 w-full"
                      value={publishDate.getMonth()}
                      onChange={(e) => {
                        const d = new Date(publishDate);
                        d.setMonth(parseInt(e.target.value));
                        setPublishDate(d);
                      }}
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      className="bg-transparent border-none focus:ring-0 w-12 text-center"
                      value={publishDate.getDate()}
                      onChange={(e) => {
                        const d = new Date(publishDate);
                        d.setDate(parseInt(e.target.value) || 1);
                        setPublishDate(d);
                      }}
                    />
                    <input 
                      type="number" 
                      className="bg-transparent border-none focus:ring-0 w-16 text-right"
                      value={publishDate.getFullYear()}
                      onChange={(e) => {
                        const d = new Date(publishDate);
                        d.setFullYear(parseInt(e.target.value));
                        setPublishDate(d);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] ml-1">Bundle Category</label>
                  <div className="flex items-center gap-2 h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold">
                    <FolderOpen size={18} className="text-[var(--color-primary)]" />
                    <select 
                      className="bg-transparent border-none focus:ring-0 w-full"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {sequelCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] ml-1">Executive Summary</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context for this issue..."
                  className="w-full h-32 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium resize-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: BUNDLE CONTENTS --- */}
        <section className="space-y-6 pt-8 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-indigo-500 rounded-full" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Content Inventory</h2>
            </div>
            
            <button 
              onClick={handleAddArticleClick}
              className="px-6 h-12 rounded-full bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <PlusCircle size={18} /> Add Piece
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {articles.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-16 text-center bg-[var(--color-surface)] rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)]"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] mb-4">Registry is Empty</p>
                  <h3 className="text-xl font-black text-[var(--color-text)]/20 uppercase">Initialize first unit to begin</h3>
                </motion.div>
              ) : (
                articles.map((article, idx) => (
                  <motion.div 
                    key={article.id}
                    layoutId={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-indigo-500/50 transition-colors shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black flex-shrink-0">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest border border-[var(--color-primary)]/20">
                          {article.categoryName}
                        </span>
                      </div>
                      <h4 className="text-lg font-black truncate">{article.title || 'Untitled Article'}</h4>
                      <p className="text-xs text-[var(--color-muted)] font-bold">By {article.authorName || 'Unnamed Writer'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingArticleId(article.id)}
                        className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-[var(--color-border)] flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Pen size={18} />
                      </button>
                      <button 
                        onClick={() => removeArticle(article.id)}
                        className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* --- FLOATING BOTTOM ACTIONS --- */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-[50]">
        <div className="bg-[var(--color-surface)]/90 backdrop-blur-2xl border border-[var(--color-border)] p-3 rounded-[2.5rem] shadow-2xl flex items-center gap-3">
          <div className="flex-1 px-4">
             <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Matrix Status</div>
             <div className="text-xs font-bold truncate">{articles.length} Units in Bundle</div>
          </div>
          
          <button 
            disabled={isSubmitting}
            onClick={() => handleFinalSave(isAdmin ? 'draft' : 'draft')}
            className="h-12 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-colors"
          >
            Save Draft
          </button>

          {isAdmin ? (
            <button 
              disabled={isSubmitting}
              onClick={() => handleFinalSave('published')}
              className="h-14 px-8 rounded-[1.5rem] bg-[var(--color-primary)] text-black font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-[var(--color-primary)]/20 group hover:scale-105 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="-rotate-12 group-hover:rotate-0 transition-transform" />}
              Publish Issue
            </button>
          ) : (
            <button 
              disabled={isSubmitting}
              onClick={() => handleFinalSave('in_review')}
              className="h-14 px-8 rounded-[1.5rem] bg-[var(--color-primary)] text-black font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-[var(--color-primary)]/20 active:scale-95 transition-all"
            >
              Submit Bundle
            </button>
          )}
        </div>
      </div>

      {/* --- CATEGORY PICKER MODAL --- */}
      <AnimatePresence>
        {isAddingArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingArticle(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--color-surface)] rounded-[3rem] p-8 shadow-2xl overflow-hidden border border-[var(--color-border)]"
            >
              <div className="mb-8 text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                  <Layout size={32} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Classification</h3>
                <p className="text-xs text-[var(--color-muted)] font-bold">Select the type of content to add</p>
              </div>

              <div className="grid grid-cols-1 gap-2 mb-8">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryForNew(cat.id)}
                    className={`h-14 rounded-2xl border-2 px-6 flex items-center justify-between text-sm font-black uppercase tracking-wider transition-all ${
                      selectedCategoryForNew === cat.id 
                      ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500' 
                      : 'border-[var(--color-border)] hover:border-[var(--color-muted)]/50'
                    }`}
                  >
                    {cat.name}
                    {selectedCategoryForNew === cat.id && <Check size={18} />}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAddingArticle(false)}
                  className="flex-1 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmCategorySelection}
                  disabled={!selectedCategoryForNew}
                  className="flex-[1.5] h-14 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  Initialize Editor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FULL SCREEN ARTICLE EDITOR --- */}
      <AnimatePresence>
        {editingArticleId && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-[var(--color-background)] flex flex-col"
          >
            {/* Minimal Header for Article Editor */}
            <div className="h-16 border-b border-[var(--color-border)] px-4 flex items-center justify-between bg-[var(--color-surface)]">
               <div className="flex items-center gap-3">
                 <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-widest">
                   Bundle Editor Mode
                 </div>
               </div>
               <button 
                 onClick={() => setEditingArticleId(null)}
                 className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ArticleWriteEditor 
                categories={categories}
                onBack={() => setEditingArticleId(null)}
                onSubmit={async (data) => handleArticleUpdate(editingArticleId, data)}
                onSaveDraft={async (data) => handleArticleUpdate(editingArticleId, data)}
                initialData={articles.find(a => a.id === editingArticleId)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
