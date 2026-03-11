'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  FileText, Sparkles, Edit2, Trash2,
  Eye, CheckSquare, Search, Tag, Calendar, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import {
  bulkDeleteArticles, bulkUpdateStatus, deleteArticleAction
} from './actions';
import { 
  PresenceCard, 
  PresenceButton, 
  PresenceSectionHeader 
} from '@/components/PresenceUI';

export type Article = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  is_deleted: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  published_at?: string | null;
  author_id: string;
  category_id?: string | null;
  profiles?: { full_name: string } | null;
  categories?: { name: string } | null;
  views?: number;
};

export default function ArticlesClient({
  articles,
  users,
  categories,
  currentUserRole
}: {
  articles: Article[],
  users: { id: string, name: string }[],
  categories: { id: string, name: string }[],
  currentUserRole: string
}) {
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Derived state
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const status    = a.status    ?? 'draft';
      const isDeleted = a.is_deleted === true;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = (a.title ?? '').toLowerCase().includes(q);
        const inSlug  = (a.slug  ?? '').toLowerCase().includes(q);
        if (!inTitle && !inSlug) return false;
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'deleted') {
          if (!isDeleted) return false;
        } else {
          if (isDeleted) return false;
          if (status !== statusFilter) return false;
        }
      } else {
        if (isDeleted) return false;
      }

      if (authorFilter !== 'all' && a.author_id !== authorFilter) return false;
      if (categoryFilter !== 'all' && a.category_id !== categoryFilter) return false;

      return true;
    });
  }, [articles, searchQuery, statusFilter, authorFilter, categoryFilter]);

  const canManage = ['admin', 'super_admin'].includes(currentUserRole);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const wrapAction = async (promise: Promise<{ error?: string, success?: boolean }>, successMsg: string) => {
    startTransition(async () => {
      const res = await promise;
      if (res.error) toast.error(res.error);
      else {
        toast.success(successMsg);
        setSelectedIds(new Set());
      }
      return;
    });
  };

  const handleBulkDelete = () => {
    if (!confirm('Are you sure you want to delete selected articles?')) return;
    wrapAction(bulkDeleteArticles(Array.from(selectedIds)), 'Articles deleted');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <PresenceSectionHeader title="Article Library" />
        <Link href="/admin/articles/new">
          <PresenceButton className="bg-[#5c4ae4] shadow-indigo-500/20 hover:bg-[#4534c7]">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.25} /> New Article
          </PresenceButton>
        </Link>
      </div>

      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" strokeWidth={1.25} />
            <input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar shrink-0">
             <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm font-bold text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              {canManage && <option value="archived">Archived</option>}
              {canManage && <option value="deleted">Trash</option>}
            </select>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm font-bold text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </PresenceCard>

      {selectedIds.size > 0 && canManage && (
        <div className="sticky top-4 z-50 flex items-center justify-between p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-2 border-indigo-500/20 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">
              {selectedIds.size}
            </div>
            <span className="text-sm font-black text-indigo-500 uppercase tracking-widest">selected</span>
          </div>
          <div className="flex items-center gap-2">
            <PresenceButton variant="outline" className="h-9 px-4 rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 font-bold" onClick={() => wrapAction(bulkUpdateStatus(Array.from(selectedIds), 'published'), 'Articles published')} loading={isPending}>
              Publish
            </PresenceButton>
            <PresenceButton variant="outline" className="h-9 px-4 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold" onClick={() => wrapAction(bulkUpdateStatus(Array.from(selectedIds), 'draft'), 'Reverted to draft')} loading={isPending}>
              Draft
            </PresenceButton>
            <PresenceButton variant="destructive" className="h-9 px-4 rounded-xl font-bold bg-rose-500 text-white" onClick={handleBulkDelete} loading={isPending}>
              <Trash2 className="w-4 h-4 mr-1.5" strokeWidth={1.25} /> Delete
            </PresenceButton>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <PresenceCard className="py-20 text-center flex flex-col items-center border-dashed border-2 border-indigo-100">
            <FileText className="w-16 h-16 mb-4 text-indigo-100" />
            <p className="font-black text-xl tracking-tight text-zinc-500">No articles found</p>
            <p className="text-sm text-zinc-500/60 mt-2 font-bold uppercase tracking-widest">Adjust your search or filters</p>
          </PresenceCard>
        ) : (
          filteredArticles.map(a => {
            const isSelected = selectedIds.has(a.id);
            const status     = a.status    ?? 'draft';
            const isDeleted  = a.is_deleted === true;
            const isFeatured = a.is_featured === true;

            return (
              <PresenceCard key={a.id} noPadding className={`group transition-all duration-300 ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : 'hover:shadow-md'} ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                  
                  {canManage && !isDeleted && (
                    <button 
                      onClick={() => toggleSelect(a.id)} 
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all ${isSelected ? 'bg-[#5c4ae4] border-[#5c4ae4] text-white' : 'border-zinc-100 dark:border-white/10 text-transparent hover:border-indigo-300'}`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.25} />
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                       {isFeatured && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" strokeWidth={1.25} />}
                       <Link href={`/admin/articles/${a.id}/edit`} className="font-black text-lg md:text-xl tracking-tight truncate hover:text-[#5c4ae4] transition-colors">{a.title}</Link>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[8px] font-black text-zinc-500">
                           {(a.profiles?.full_name || 'A').charAt(0)}
                         </div>
                         <span className="text-xs font-bold text-zinc-500 truncate max-w-[120px]">{a.profiles?.full_name || 'Anonymous'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-indigo-300" strokeWidth={1.25} />
                        <span className="text-xs font-bold text-zinc-500">{a.categories?.name || 'Uncategorized'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-300" strokeWidth={1.25} />
                        <span className="text-xs font-bold text-zinc-500">{a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Draft'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                        <Eye className="w-3 h-3" strokeWidth={1.25} />
                        <span className="text-[10px] font-black">{a.views?.toLocaleString() || 0}</span>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border-2 shadow-sm ${
                        status === 'published' ? 'text-emerald-500 border-emerald-50 bg-emerald-50/50' :
                        status === 'in_review' ? 'text-amber-500 border-amber-50 bg-amber-50/50' :
                        'text-zinc-500 border-gray-50 bg-gray-50/50'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link href={`/${a.slug}`} target="_blank" className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-indigo-400 transition-colors">
                      <Eye className="w-5 h-5" strokeWidth={1.25} />
                    </Link>
                    <Link href={`/admin/articles/${a.id}/edit`} className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] hover:bg-[#5c4ae4] hover:text-white transition-all shadow-sm">
                      <Edit2 className="w-5 h-5" strokeWidth={1.25} />
                    </Link>
                    {canManage && (
                      <button 
                        onClick={() => { if (confirm('Delete?')) wrapAction(deleteArticleAction(a.id), 'Deleted'); }}
                         className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={1.25} />
                      </button>
                    )}
                  </div>
                </div>
              </PresenceCard>
            );
          })
        )}
      </div>
    </div>
  );
}
