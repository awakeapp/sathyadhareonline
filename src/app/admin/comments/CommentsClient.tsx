'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  updateCommentStatusAction, 
  deleteCommentAction, 
  bulkUpdateCommentsAction, 
  bulkDeleteCommentsAction 
} from './actions';
import { 
  Search, CheckCircle2, X as RejectIcon, ShieldAlert, Trash2, MessageSquare, CheckSquare, Clock, User
} from 'lucide-react';
import { 
  PresenceCard 
} from '@/components/PresenceUI';

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
  profiles?: { full_name: string | null, email: string | null } | null;
}

export default function CommentsClient({ 
  comments, 
  articlesList 
}: { 
  comments: CommentType[], 
  articlesList: { id: string, title: string }[] 
}) {
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [articleFilter, setArticleFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const MatchName = c.guest_name?.toLowerCase().includes(query) || false;
        const MatchContent = c.content?.toLowerCase().includes(query) || false;
        if (!MatchName && !MatchContent) return false;
      }
      if (statusFilter !== 'all') {
         if (statusFilter === 'spam' && !c.is_spam) return false;
         if (statusFilter !== 'spam' && c.is_spam) return false;
         if (statusFilter !== 'spam' && c.status !== statusFilter) return false;
      }
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
      return;
    });
  };

  const handleBulkDelete = () => {
    if (!confirm('Permanent wipe selected?')) return;
    wrapAction(bulkDeleteCommentsAction(Array.from(selectedIds)), 'Removed');
  };

  return (
    <div className="space-y-6">
      
      {/* ── Filter Engine ── */}
      <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input 
               placeholder="Search registry..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-[#1b1929] border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-14 px-4 rounded-2xl bg-white dark:bg-[#1b1929] border-none shadow-sm font-bold text-xs uppercase tracking-widest text-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="spam">Spam</option>
            </select>
            <select value={articleFilter} onChange={(e) => setArticleFilter(e.target.value)} className="h-14 px-4 rounded-2xl bg-white dark:bg-[#1b1929] border-none shadow-sm font-bold text-xs uppercase tracking-widest text-indigo-400 focus:ring-2 focus:ring-indigo-500/20 max-w-[150px]">
              <option value="all">Articles: All</option>
              {articlesList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
        </div>
      </PresenceCard>

      {/* ── Bulk Bar ── */}
      {selectedIds.size > 0 && (
         <div className="sticky top-24 z-30 flex items-center justify-between p-5 bg-[#5c4ae4] rounded-3xl shadow-2xl shadow-indigo-500/30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white font-black flex items-center justify-center">
                {selectedIds.size}
              </div>
              <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Intercepted Targets</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => wrapAction(bulkUpdateCommentsAction(Array.from(selectedIds), 'approved'), 'Cleaned & Approved')} className="h-11 px-6 rounded-xl bg-white/10 text-white hover:bg-white/20 font-black text-[10px] uppercase tracking-widest transition-all">Approve</button>
              <button onClick={handleBulkDelete} className="w-11 h-11 rounded-xl bg-white text-[#5c4ae4] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                 <Trash2 className="w-5 h-5" />
              </button>
            </div>
         </div>
      )}

      {/* ── Comment Stream ── */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <MessageSquare className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-gray-400 uppercase tracking-widest">No Communications</p>
          </PresenceCard>
        ) : (
          filteredComments.map(c => {
             const isSelected = selectedIds.has(c.id);
             const name = c.guest_name || c.profiles?.full_name || 'Anonymous Intelligence';
             const isPendingStatus = c.status === 'pending';

             return (
               <PresenceCard key={c.id} noPadding className={`group transition-all ${isSelected ? 'ring-2 ring-[#5c4ae4]' : ''} ${c.status !== 'pending' ? 'opacity-80' : ''}`}>
                  <div className="p-5 flex flex-col md:flex-row gap-5">
                    
                    <div className="shrink-0 pt-1">
                       <button onClick={() => toggleSelect(c.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-[#5c4ae4] text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-200 border-2 border-transparent hover:border-indigo-100'}`}>
                          <CheckSquare className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="flex-1 min-w-0">
                       <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] shrink-0">
                             <User className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="font-black text-[#1b1929] dark:text-white truncate">{name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <Clock className="w-3 h-3 text-gray-300" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                   {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </div>
                          <div className="md:ml-auto flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                c.status === 'approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                                c.status === 'rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                'bg-amber-50 text-amber-500 border-amber-100'
                             }`}>
                                {c.status}
                             </span>
                             {c.is_spam && (
                               <span className="px-3 py-1 rounded-lg text-[9px] bg-indigo-900/10 text-indigo-400 border border-indigo-500/10 font-black uppercase tracking-widest flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" /> SPAM
                               </span>
                             )}
                          </div>
                       </div>

                       <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-3 border-l-4 border-indigo-100 dark:border-indigo-500/20">
                              &ldquo;{c.content}&rdquo;
                       </div>

                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-300 uppercase shrink-0">Origin</span>
                          <Link href={`/admin/articles/${c.article_id}/edit`} className="text-[10px] font-black text-[#5c4ae4] uppercase tracking-widest hover:underline truncate">
                             {c.articles?.title ?? 'Unknown Log'}
                          </Link>
                       </div>
                    </div>

                    <div className="shrink-0 flex md:flex-col gap-2 pt-1">
                       {!c.is_spam && isPendingStatus && (
                         <button onClick={() => wrapAction(updateCommentStatusAction(c.id, 'approved'), 'Access Granted')} className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all">
                            <CheckCircle2 className="w-6 h-6" />
                         </button>
                       )}
                       {isPendingStatus && (
                         <button onClick={() => wrapAction(updateCommentStatusAction(c.id, 'rejected'), 'Target Quarantined')} className="w-12 h-12 rounded-xl bg-orange-400 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 transition-all">
                            <RejectIcon className="w-6 h-6" />
                         </button>
                       )}
                       <button onClick={() => { if(confirm('Purge?')) wrapAction(deleteCommentAction(c.id), 'Expunged') }} className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                          <Trash2 className="w-6 h-6" />
                       </button>
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
