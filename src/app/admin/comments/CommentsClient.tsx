'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { toast } from 'sonner';
import { 
  updateCommentStatusAction, 
  deleteCommentAction, 
  bulkUpdateCommentsAction, 
  bulkDeleteCommentsAction 
} from './actions';
import { 
  Search, CheckCircle2, X as RejectIcon, ShieldAlert, Trash2, MessageSquare, ExternalLink, CheckSquare
} from 'lucide-react';

interface CommentType {
  id: string;
  article_id: string;
  guest_name: string | null;
  user_id: string | null;
  content: string;
  status: string;
  is_spam: boolean;
  created_at: string;
  articles: { title: string } | null;
}

export default function CommentsClient({ 
  comments, 
  articlesList 
}: { 
  comments: CommentType[], 
  articlesList: { id: string, title: string }[] 
}) {
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [articleFilter, setArticleFilter] = useState('all');

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Derived
  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      // 1. Search (guest name or content)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const MatchName = c.guest_name?.toLowerCase().includes(query) || false;
        const MatchContent = c.content?.toLowerCase().includes(query) || false;
        if (!MatchName && !MatchContent) return false;
      }
      
      // 2. Status
      if (statusFilter !== 'all') {
         if (statusFilter === 'spam' && !c.is_spam) return false;
         if (statusFilter !== 'spam' && c.is_spam) return false;
         if (statusFilter !== 'spam' && c.status !== statusFilter) return false;
      }

      // 3. Article
      if (articleFilter !== 'all' && c.article_id !== articleFilter) return false;

      return true;
    });
  }, [comments, searchQuery, statusFilter, articleFilter]);

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
    if (!confirm('Permanently wipe selected comments?')) return;
    wrapAction(bulkDeleteCommentsAction(Array.from(selectedIds)), 'Comments deleted');
  };

  const statusColors: Record<string, string> = {
    pending:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="space-y-6">
      
      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <Card className="rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input 
               placeholder="Search user or content..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 h-11 w-full bg-black/20"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar flex-shrink-0">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[140px] h-11 bg-black/20">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="spam">Spam</option>
            </Select>
            <Select value={articleFilter} onChange={(e) => setArticleFilter(e.target.value)} className="w-[180px] h-11 bg-black/20">
              <option value="all">All Articles</option>
              {articlesList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk Actions Bar ──────────────────────────────────────── */}
      {selectedIds.size > 0 && (
         <div className="sticky top-20 z-20 flex items-center justify-between p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 backdrop-blur-md rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-black font-black text-xs flex items-center justify-center">
                {selectedIds.size}
              </div>
              <span className="text-sm font-bold text-[var(--color-primary)]">comments selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => wrapAction(bulkUpdateCommentsAction(Array.from(selectedIds), 'approved'), 'Approved')} loading={isPending}>
                Approve
              </Button>
              <Button size="sm" variant="outline" className="h-9 border-orange-500/30 text-orange-500 hover:bg-orange-500/10" onClick={() => wrapAction(bulkUpdateCommentsAction(Array.from(selectedIds), 'rejected', true), 'Marked as Spam')} loading={isPending}>
                Spam
              </Button>
              <Button size="sm" variant="destructive" className="h-9" onClick={handleBulkDelete} loading={isPending}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            </div>
         </div>
      )}

      {/* ── List ──────────────────────────────────────────────────── */}
      {filteredComments.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No comments found</p>
          <p className="text-sm text-[var(--color-muted)]">Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="space-y-3">
           {filteredComments.map(c => {
             const isSelected = selectedIds.has(c.id);
             return (
               <Card key={c.id} className={`overflow-hidden transition-all duration-300 border bg-[var(--color-surface)] shadow-none rounded-3xl ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-transparent hover:border-[var(--color-border)]'} ${c.status !== 'pending' ? 'opacity-80' : ''}`}>
                 <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                   <button onClick={() => toggleSelect(c.id)} className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors mt-1 sm:mt-0 ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black' : 'border-[var(--color-border)] text-transparent hover:border-white'}`}>
                     <CheckSquare className="w-3.5 h-3.5" />
                   </button>
                   
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {c.guest_name || 'Registered User'}
                        </span>
                        <div className="flex gap-2">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColors[c.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                             {c.status}
                           </span>
                           {c.is_spam && (
                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black uppercase tracking-wider">
                               <ShieldAlert className="w-3 h-3" /> Spam
                             </span>
                           )}
                        </div>
                      </div>
                      
                      <div className="text-[11px] text-[var(--color-muted)] font-medium mb-2 flex items-center gap-1.5 flex-wrap">
                        <span>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                        <span className="opacity-50">·</span>
                        <span className="truncate max-w-[200px]">On: <Link href={`/admin/articles/${c.article_id}/edit`} className="text-white hover:text-[var(--color-primary)] transition-colors">{c.articles?.title ?? c.article_id}</Link></span>
                      </div>

                      <p className="text-sm text-[var(--color-muted)] line-clamp-3 bg-black/20 rounded-xl py-2 px-3 border border-[var(--color-border)]/50 mr-4">
                        {c.content}
                      </p>
                   </div>

                   <div className="flex flex-wrap sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 border-t sm:border-t-0 border-[var(--color-border)] sm:pt-0">
                     {c.status !== 'approved' && (
                       <Button size="sm" variant="outline" className="w-full h-8 text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" onClick={() => wrapAction(updateCommentStatusAction(c.id, 'approved'), 'Approved')} loading={isPending}>
                         <CheckCircle2 className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Approve</span>
                       </Button>
                     )}
                     {c.status !== 'rejected' && (
                       <Button size="sm" variant="outline" className="w-full h-8 text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10" onClick={() => wrapAction(updateCommentStatusAction(c.id, 'rejected'), 'Rejected')} loading={isPending}>
                         <RejectIcon className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Reject</span>
                       </Button>
                     )}
                     {!c.is_spam && (
                       <Button size="sm" variant="outline" className="w-full h-8 text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10" onClick={() => wrapAction(updateCommentStatusAction(c.id, 'rejected', true), 'Marked as Spam')} loading={isPending}>
                         <ShieldAlert className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Spam</span>
                       </Button>
                     )}
                     <Button size="sm" variant="outline" className="w-full h-8 text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10" onClick={() => { if(confirm('Delete permanently?')) wrapAction(deleteCommentAction(c.id), 'Deleted') }} loading={isPending}>
                       <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Delete</span>
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             );
           })}
        </div>
      )}

    </div>
  );
}
