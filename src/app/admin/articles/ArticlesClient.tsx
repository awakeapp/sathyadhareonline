'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import {
  FileText, Sparkles, Edit2, Share, Trash2,
  RefreshCcw, Eye, Star, CheckSquare, Search, Hash, User, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  bulkDeleteArticles, bulkUpdateStatus,
  restoreArticleAction, featureArticleAction, deleteArticleAction
} from './actions';

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
  const [authorFilter, setAuthorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Derived state
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      // Normalise nullable DB values
      const status    = a.status    ?? 'draft';
      const isDeleted = a.is_deleted === true;

      // 1. Search — Unicode/Kannada-safe
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = (a.title ?? '').toLowerCase().includes(q);
        const inSlug  = (a.slug  ?? '').toLowerCase().includes(q);
        if (!inTitle && !inSlug) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'deleted') {
          if (!isDeleted) return false;
        } else {
          if (isDeleted) return false;
          if (status !== statusFilter) return false;
        }
      } else {
        if (isDeleted) return false; // hide deleted from 'all'
      }

      // 3. Author
      if (authorFilter !== 'all' && a.author_id !== authorFilter) return false;

      // 4. Category
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
    });
  };

  const handleBulkDelete = () => {
    if (!confirm('Are you sure you want to delete selected articles?')) return;
    wrapAction(bulkDeleteArticles(Array.from(selectedIds)), 'Articles deleted');
  };

  return (
    <div className="space-y-6">

      {/* ── Filters ─────────────────────────────────────── */}
      <Card className="rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input
              placeholder="Search articles by title or slug…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 w-full bg-black/20"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar flex-shrink-0">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[140px] h-11 bg-black/20">
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              {canManage && <option value="archived">Archived</option>}
              {canManage && <option value="deleted">Trash</option>}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-[140px] h-11 bg-black/20">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="w-[140px] h-11 bg-black/20">
              <option value="all">All Authors</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk Actions Bar ─────────────────────────────── */}
      {selectedIds.size > 0 && canManage && (
        <div className="sticky top-20 z-20 flex items-center justify-between p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 backdrop-blur-md rounded-2xl shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-black font-black text-xs flex items-center justify-center">
              {selectedIds.size}
            </div>
            <span className="text-sm font-bold text-[var(--color-primary)]">articles selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => wrapAction(bulkUpdateStatus(Array.from(selectedIds), 'published'), 'Articles published')} loading={isPending}>
              Publish
            </Button>
            <Button size="sm" variant="outline" className="h-9 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" onClick={() => wrapAction(bulkUpdateStatus(Array.from(selectedIds), 'draft'), 'Reverted to draft')} loading={isPending}>
              Draft
            </Button>
            <Button size="sm" variant="destructive" className="h-9" onClick={handleBulkDelete} loading={isPending}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* ── List ────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card className="py-20 text-center flex flex-col items-center border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none bg-[var(--color-surface)]">
            <FileText className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
            <p className="font-bold mb-1 text-lg tracking-tight">No articles found</p>
            <p className="text-sm text-[var(--color-muted)]">Try adjusting your filters.</p>
          </Card>
        ) : (
          filteredArticles.map(a => {
            const isSelected = selectedIds.has(a.id);
            const status     = a.status    ?? 'draft';
            const isDeleted  = a.is_deleted === true;
            const isFeatured = a.is_featured === true;

            return (
              <Card key={a.id} className={`rounded-3xl border transition-all duration-300 group ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-transparent bg-[var(--color-surface)] hover:border-[var(--color-border)]'} ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">

                  {canManage && !isDeleted && (
                    <button onClick={() => toggleSelect(a.id)} className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors mt-1 sm:mt-0 ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black' : 'border-[var(--color-border)] text-transparent hover:border-white'}`}>
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Title and metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      {isFeatured && <Star className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />}
                      <Link href={`/admin/articles/${a.id}/edit`} className="font-bold text-[15px] sm:text-base leading-tight truncate hover:text-[#a78bfa] transition-colors">{a.title}</Link>
                      {isDeleted && (
                        <span className="shrink-0 text-[9px] font-black uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">Deleted</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-muted)] font-medium">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{a.profiles?.full_name || 'Anonymous'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{a.categories?.name || 'Uncategorized'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Unpublished'}
                      </span>
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <Eye className="w-3 h-3 flex-shrink-0" />
                        {a.views?.toLocaleString() || 0}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        status === 'published' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                        status === 'in_review' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                        status === 'archived'  ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' :
                        'text-gray-400 border-gray-500/20 bg-gray-500/5'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full sm:w-auto flex flex-wrap gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] justify-end">

                    <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                      <Link href={`/${a.slug}`} target="_blank" title="View Article"><Share className="w-3.5 h-3.5" /></Link>
                    </Button>

                    {!isDeleted && (
                      <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0 text-[#a78bfa] border-[#a78bfa]/30 hover:bg-[#a78bfa]/10">
                        <Link href={`/admin/articles/${a.id}/edit`}><Edit2 className="w-3.5 h-3.5" /></Link>
                      </Button>
                    )}

                    {!isDeleted && canManage && status === 'published' && (
                      <Button variant={isFeatured ? 'primary' : 'outline'} size="icon" className={`h-8 w-8 rounded-lg shrink-0 ${isFeatured ? 'shadow-sm text-black' : ''}`} onClick={() => wrapAction(featureArticleAction(a.id, isFeatured), isFeatured ? 'Unfeatured' : 'Featured')} loading={isPending}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {!isDeleted && canManage && (
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0 text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={() => { if (confirm('Delete article?')) wrapAction(deleteArticleAction(a.id), 'Deleted'); }} loading={isPending}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {isDeleted && canManage && (
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => wrapAction(restoreArticleAction(a.id), 'Restored')} loading={isPending}>
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
