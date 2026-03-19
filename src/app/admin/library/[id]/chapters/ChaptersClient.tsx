'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Plus, GripVertical, Edit2, 
  Trash2, BookOpen, FileText, ArrowLeft
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { 
  PresenceCard, 
  PresenceButton, 
} from '@/components/PresenceUI';
import { deleteChapter, reorderChapters, createChapter } from '../../actions';

interface Chapter {
  id: string;
  title: string;
  slug: string;
  status: string;
  order_index: number;
  created_at: string;
}

export default function ChaptersClient({ 
  book, 
  chapters: initialChapters 
}: { 
  book: { id: string, title: string }, 
  chapters: Chapter[] 
}) {
  const [chapters, setChapters] = useState(initialChapters);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteChapter(id);
      if (res.success) {
        toast.success('Chapter deleted');
        setChapters(prev => prev.filter(c => c.id !== id));
        setDeleteId(null);
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    });
  };

  const handleReorder = async (dir: 'up' | 'down', idx: number) => {
    const newChapters = [...chapters];
    if (dir === 'up' && idx > 0) {
      [newChapters[idx], newChapters[idx - 1]] = [newChapters[idx - 1], newChapters[idx]];
    } else if (dir === 'down' && idx < newChapters.length - 1) {
      [newChapters[idx], newChapters[idx + 1]] = [newChapters[idx + 1], newChapters[idx]];
    } else {
      return;
    }

    setChapters(newChapters);
    startTransition(async () => {
      const res = await reorderChapters(book.id, newChapters.map(c => c.id));
      if (!res.success) toast.error('Failed to save order');
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-[calc(var(--bottom-nav-height)+1rem)]">
      
      {/* Book Info Card */}
      <PresenceCard className="mb-6 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-8 h-8 min-w-[44px] min-h-[44px]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight">{book.title}</h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
              Table of Contents · {chapters.length} Chapters
            </p>
          </div>
        </div>
      </PresenceCard>

      {/* Chapters List */}
      <div className="space-y-3">
        {chapters.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <FileText className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-zinc-400 uppercase tracking-widest">No Chapters Yet</p>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2">Start adding chapters to this book.</p>
            <Link href={`/admin/library/${book.id}/chapters/new`} className="mt-6">
              <PresenceButton className="px-8 shadow-lg shadow-indigo-500/20">
                Create First Chapter
              </PresenceButton>
            </Link>
          </PresenceCard>
        ) : (
          chapters.map((ch, idx) => (
            <PresenceCard key={ch.id} noPadding className="group overflow-hidden">
              <div className="flex items-stretch min-h-[80px]">
                <div className="w-12 bg-zinc-50 dark:bg-zinc-900 border-r border-[var(--color-border)] flex flex-col items-center justify-center gap-1">
                  <button 
                    disabled={idx === 0 || isPending}
                    onClick={() => handleReorder('up', idx)}
                    className="p-1 text-zinc-400 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black text-zinc-400">{idx + 1}</span>
                </div>
                
                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                   <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                        {ch.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                         <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${
                           ch.status === 'published' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-amber-50 border-amber-100 text-amber-500'
                         }`}>
                           {ch.status}
                         </span>
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                           {new Date(ch.created_at).toLocaleDateString()}
                         </span>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/admin/library/${book.id}/chapters/${ch.id}/edit`}>
                        <button className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800 flex items-center justify-center transition-all min-w-[44px] min-h-[44px]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button 
                        onClick={() => setDeleteId(ch.id)}
                        className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all min-w-[44px] min-h-[44px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link href={`/admin/library/${book.id}/chapters/${ch.id}/edit`}>
                        <button className="h-10 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                          Review
                        </button>
                      </Link>
                   </div>
                </div>
              </div>
            </PresenceCard>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link href={`/admin/library/${book.id}/chapters/new`}>
          <button className="w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </Link>
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <PresenceCard className="w-full max-w-sm p-8 text-center animate-in zoom-in-95">
             <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
                <Trash2 className="w-8 h-8 min-w-[44px] min-h-[44px]" />
             </div>
             <h3 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight mb-2">Delete Chapter?</h3>
             <p className="text-xs text-zinc-500 mb-8 px-4 leading-relaxed">This will permanently remove the chapter content. This action cannot be undone.</p>
             <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20">Delete</button>
             </div>
          </PresenceCard>
        </div>
      )}

    </div>
  );
}
