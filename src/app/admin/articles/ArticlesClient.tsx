'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  FileText, Edit2, Trash2, Eye, Plus, 
  MoreHorizontal, Search, CheckCircle2, Clock, 
  Archive, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import {
  bulkDeleteArticles, bulkUpdateStatus, deleteArticleAction
} from './actions';
import { 
  PresenceCard, 
  PresenceButton, 
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
  const [activeTab, setActiveTab] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Status definitions
  const TABS = [
    { id: 'all', label: 'All Articles' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Drafts' },
    { id: 'in_review', label: 'In Review' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'archived', label: 'Archived' },
  ];

  // Derived state
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      let status = a.status ?? 'draft';
      const isDeleted = a.is_deleted === true;
      
      // Determine if scheduled
      if (status === 'published' && a.published_at && new Date(a.published_at) > new Date()) {
        status = 'scheduled';
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = (a.title ?? '').toLowerCase().includes(q);
        const inSlug  = (a.slug  ?? '').toLowerCase().includes(q);
        if (!inTitle && !inSlug) return false;
      }

      if (activeTab !== 'all') {
        if (activeTab === 'archived') {
          if (!isDeleted) return false;
        } else {
          if (isDeleted) return false;
          if (status !== activeTab) return false;
        }
      } else {
        if (isDeleted) return false;
      }

      if (authorFilter !== 'all' && a.author_id !== authorFilter) return false;
      if (categoryFilter !== 'all' && a.category_id !== categoryFilter) return false;

      return true;
    });
  }, [articles, searchQuery, activeTab, authorFilter, categoryFilter]);

  const canManage = ['admin', 'super_admin'].includes(currentUserRole);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArticles.map(a => a.id)));
    }
  };

  const wrapAction = async (promise: Promise<{ error?: string, success?: boolean }>, successMsg: string) => {
    startTransition(async () => {
      const res = await promise;
      if (res.error) toast.error(res.error);
      else {
        toast.success(successMsg);
        setSelectedIds(new Set());
      }
    });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    wrapAction(deleteArticleAction(itemToDelete), 'Article moved to trash');
    setItemToDelete(null);
  };

  const renderStatusChip = (article: Article) => {
    let statusId = article.status ?? 'draft';
    if (statusId === 'published' && article.published_at && new Date(article.published_at) > new Date()) {
      statusId = 'scheduled';
    }
    if (article.is_deleted) statusId = 'archived';

    const styles: Record<string, string> = {
      published: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
      draft: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10',
      in_review: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
      scheduled: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
      archived: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    };
    
    const icons: Record<string, React.ReactNode> = {
      published: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      draft: <FileText className="w-3.5 h-3.5 mr-1" />,
      in_review: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
      scheduled: <Clock className="w-3.5 h-3.5 mr-1" />,
      archived: <Archive className="w-3.5 h-3.5 mr-1" />,
    };

    const label = statusId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-[12px] font-medium ring-1 ring-inset ${styles[statusId]}`}>
        {icons[statusId]}
        {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto w-full pb-20 md:pb-0">
      
      {/* ── Page Header & Desktop Actions ── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">Content</h1>
          <p className="text-[14px] text-[var(--color-muted)] mt-1">Manage all articles across the platform.</p>
        </div>
        <div className="hidden md:flex gap-3">
          <Link href="/admin/articles/new">
            <PresenceButton className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Create Article
            </PresenceButton>
          </Link>
        </div>
      </div>

      {/* ── Filters & Tabs ── */}
      <PresenceCard className="p-0 overflow-hidden">
        {/* Top Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-[var(--color-border)] hide-scrollbar px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-3.5 text-[14px] font-semibold transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Selectors */}
        <div className="p-3 bg-[var(--color-surface-2)] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 shrink-0 overflow-x-auto">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 pl-8 pr-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <select 
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="h-10 pl-8 pr-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none appearance-none"
              >
                <option value="all">All Authors</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </PresenceCard>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.size > 0 && canManage && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl mb-2 animate-in fade-in">
          <span className="text-[14px] font-semibold text-indigo-700 dark:text-indigo-400">
            {selectedIds.size} items selected
          </span>
          <div className="flex items-center gap-2">
            <button disabled={isPending} onClick={() => wrapAction(bulkUpdateStatus(Array.from(selectedIds), 'published'), 'Published')} className="px-3 py-1.5 text-[13px] font-medium bg-white dark:bg-black rounded border border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Publish</button>
            <button disabled={isPending} onClick={() => wrapAction(bulkUpdateStatus(Array.from(selectedIds), 'draft'), 'Drafted')} className="px-3 py-1.5 text-[13px] font-medium bg-white dark:bg-black rounded border border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">Draft</button>
            <button disabled={isPending} onClick={() => { if(confirm('Delete selected?')) wrapAction(bulkDeleteArticles(Array.from(selectedIds)), 'Deleted') }} className="px-3 py-1.5 text-[13px] font-medium bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 transition-colors">Delete</button>
          </div>
        </div>
      )}

      {/* ── Data Table / List ── */}
      <PresenceCard className="overflow-hidden noPadding">
        {filteredArticles.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[var(--color-muted)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-bold text-[var(--color-text)]">No articles found</h3>
            <p className="text-[14px] text-[var(--color-muted)] mt-1 max-w-sm">Try adjusting your filters or search query to find what you&apos;re looking for.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th className="py-3 px-4 w-[50px]">
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === filteredArticles.length && filteredArticles.length > 0} className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Title</th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Author</th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredArticles.map(a => (
                  <tr key={a.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors group">
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                    </td>
                    <td className="py-3 px-4 max-w-[300px]">
                      <div className="flex items-center gap-2">
                        {a.is_featured && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" strokeWidth={1.5} />}
                        <Link href={`/admin/articles/${a.id}/edit`} className="text-[14px] font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] truncate transition-colors">
                          {a.title}
                        </Link>
                      </div>
                      <div className="text-[12px] text-[var(--color-muted)] truncate mt-0.5">{a.categories?.name || 'Uncategorized'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {renderStatusChip(a)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(a.profiles?.full_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium text-[var(--color-text)] truncate">{a.profiles?.full_name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-[13px] font-medium text-[var(--color-text)]">{a.published_at ? new Date(a.published_at).toLocaleDateString() : new Date(a.created_at).toLocaleDateString()}</div>
                      <div className="text-[11px] text-[var(--color-muted)] mt-0.5">{a.published_at ? 'Published' : 'Created'}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link href={`/articles/${a.slug}`} target="_blank" className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-lg transition-colors" title="Preview">
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        </Link>
                        <Link href={`/admin/articles/${a.id}/edit`} className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </Link>
                        {canManage && (
                          <button onClick={() => setItemToDelete(a.id)} className="p-2 text-[var(--color-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        )}
                        <button className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-lg transition-colors md:hidden">
                          <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PresenceCard>

      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-[80px] right-4 z-40">
        <Link href="/admin/articles/new" className="flex items-center justify-center w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95">
          <Plus className="w-6 h-6" strokeWidth={2} />
        </Link>
      </div>

      {/* ── Confirmation Modal Overlay ── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setItemToDelete(null)}>
          <div className="bg-[var(--color-surface)] rounded-2xl w-full max-w-[400px] p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-500" strokeWidth={2} />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--color-text)] mb-2">Delete Article?</h3>
            <p className="text-[14px] text-[var(--color-muted)] mb-6 leading-relaxed">
              Are you sure you want to move this article to the trash? You can restore it later from the Archived filter.
            </p>
            <div className="flex gap-3 justify-end">
              <button disabled={isPending} onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors">
                Cancel
              </button>
              <button disabled={isPending} onClick={confirmDelete} className="px-4 py-2 rounded-lg text-[14px] font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-2">
                {isPending ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
