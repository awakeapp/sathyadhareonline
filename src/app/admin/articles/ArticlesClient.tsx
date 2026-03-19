"use client";

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ChevronLeft, Search, ChevronDown, MoreVertical, FileText,
  Edit2, CheckCircle2, Clock, Archive, Users, Trash2, RotateCcw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/Dropdown';
import AdminContainer from '@/components/layout/AdminContainer';
import { updateArticleStatus, assignArticle, deleteArticle } from './actions';
import { 
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter 
} from '@/components/ui/Modal';

type ArticlesClientProps = {
  articles: any[];
  staff: any[];
  currentUser: {
    id: string;
    role: string;
  };
};

type SortType = 'newest' | 'oldest' | 'updated' | 'title';
type StatusType = 'all' | 'published' | 'draft' | 'in_review' | 'assigned' | 'archived' | 'deleted';

const STATUS_TABS: { label: string; value: StatusType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Archived', value: 'archived' },
  { label: 'Recently Deleted', value: 'deleted' },
];

export default function ArticlesClient({ articles, staff, currentUser }: ArticlesClientProps) {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<StatusType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignNote, setAssignNote] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = (id: string, status: string) => {
    setUpdatingId(id);
    startTransition(async () => {
      try {
        const res = await updateArticleStatus(id, status);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success('Status updated');
          router.refresh();
        }
      } catch (err) {
        toast.error('Failed to update status');
      } finally {
        setUpdatingId(null);
      }
    });
  };

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        (a.title || '').toLowerCase().includes(q) || 
        (a.author_name || '').toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (activeStatus !== 'all') {
      if (activeStatus === 'assigned') {
        result = result.filter(a => !!a.assigned_to);
      } else {
        result = result.filter(a => a.status === activeStatus);
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'updated':
          return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return result;
  }, [articles, searchQuery, activeStatus, sortBy]);

  // Counts for tabs
  const getTabCount = (status: StatusType) => {
    let result = articles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        (a.title || '').toLowerCase().includes(q) || 
        (a.author_name || '').toLowerCase().includes(q)
      );
    }
    if (status === 'all') return result.length;
    if (status === 'assigned') return result.filter(a => !!a.assigned_to).length;
    return result.filter(a => a.status === status).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-[var(--color-muted)] opacity-40';
      case 'in_review': return 'bg-amber-400';
      case 'archived': return 'bg-indigo-400';
      case 'deleted': return 'bg-red-400';
      default: return 'bg-[var(--color-muted)] opacity-40';
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500';
      case 'draft': return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
      case 'in_review': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500';
      case 'archived': return 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'deleted': return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-500';
      default: return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <AdminContainer className="pt-6 pb-[calc(var(--bottom-nav-height)+1rem)]">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/manage" className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] active:scale-95 transition-all">
            <ChevronLeft size={24} className="text-[var(--color-text)]" />
          </Link>
          <h1 className="text-[18px] font-semibold text-[var(--color-text)]">Articles</h1>
        </div>
        <Link 
          href="/admin/articles/intake"
          className="h-[36px] px-4 rounded-full bg-[var(--color-primary)] text-white text-[14px] font-medium flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        >
          + New
        </Link>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search size={20} className="text-[var(--color-muted)]" />
        </div>
        <input 
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[44px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 text-[15px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-muted)]"
        />
      </div>

      {/* STATUS TABS & SORT DROPDOWN CONTAINER */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* STATUS TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
          {STATUS_TABS.map(tab => {
            const count = getTabCount(tab.value);
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                className={`h-[32px] px-3 rounded-full text-[12px] font-medium flex-shrink-0 whitespace-nowrap transition-colors border ${
                  isActive 
                    ? 'bg-[var(--color-text)] text-[var(--color-surface)] border-transparent'
                    : 'bg-transparent text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* SORT DROPDOWN */}
        {/* We keep standard native select styling or implement our own dropdown since Radix was removed from top import and imported from ui/Dropdown Menu. */}
        <div className="relative flex-shrink-0">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="appearance-none outline-none bg-transparent text-[13px] font-medium text-[var(--color-text)] pr-4 py-1 cursor-pointer z-10 relative"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Updated</option>
            <option value="title">A-Z</option>
          </select>
          <ChevronDown size={14} className="text-[var(--color-muted)] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ARTICLE LIST */}
      <div className="flex flex-col gap-2">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <div 
              key={article.id}
              className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px] p-[13px_14px] flex items-center gap-3 transition-opacity ${
                isPending && updatingId === article.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {/* Left: status dot */}
              <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${getStatusColor(article.status)}`} />
              
              {/* Middle */}
              <div className="flex-1 flex flex-col justify-center min-w-0 pb-[1px]">
                <div className="text-[14px] font-medium text-[var(--color-text)] truncate leading-tight mb-[3px]">
                  {article.title || 'Untitled'}
                </div>
                <div className="text-[12px] text-[var(--color-muted)] truncate leading-tight">
                  {article.author_name || 'Anonymous'}{article.category_name ? ` · ${article.category_name}` : ''} · {formatDate(article.created_at)}
                </div>
                {article.assigned_editor_name && (
                  <div className="text-[11px] font-medium text-[#6366f1] leading-tight mt-[3px] truncate">
                    → {article.assigned_editor_name}
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${getBadgeStyle(article.status)}`}>
                  {(article.status || 'draft').replace('_', ' ')}
                </div>

                {/* DROPDOWN MENU TRIGGER */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] active:scale-95 transition-all outline-none after:absolute after:-inset-1.5 cursor-pointer">
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-[200px]">
                    {article.status === 'deleted' ? (
                      <>
                        <DropdownMenuItem onClick={() => updateStatus(article.id, 'draft')}>
                          <RotateCcw size={16} className="mr-2 text-green-500" /> Restore
                        </DropdownMenuItem>
                        {currentUser.role === 'super_admin' && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedArticle(article);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                          >
                            <Trash2 size={16} className="mr-2" /> Delete Forever
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/articles/${article.id}/edit`}>
                            <Edit2 size={16} className="mr-2" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          disabled={article.status === 'published' || currentUser.role === 'editor'}
                          onClick={() => updateStatus(article.id, 'published')}
                        >
                          <CheckCircle2 size={16} className="mr-2 text-green-500" /> Set as Published
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          disabled={article.status === 'draft'}
                          onClick={() => updateStatus(article.id, 'draft')}
                        >
                          <FileText size={16} className="mr-2" /> Set as Draft
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          disabled={article.status === 'in_review'}
                          onClick={() => updateStatus(article.id, 'in_review')}
                        >
                          <Clock size={16} className="mr-2 text-amber-500" /> Set as In Review
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          disabled={article.status === 'archived'}
                          onClick={() => updateStatus(article.id, 'archived')}
                        >
                          <Archive size={16} className="mr-2 text-indigo-500" /> Set as Archived
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedArticle(article);
                            setShowAssignModal(true);
                          }}
                        >
                          <Users size={16} className="mr-2 text-indigo-500" /> Assign
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedArticle(article);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                        >
                          <Trash2 size={16} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            {searchQuery.trim() ? (
              <>
                <Search size={32} className="text-[var(--color-muted)] mb-4 opacity-50" />
                <p className="text-[15px] font-medium text-[var(--color-text)]">
                  No results for &quot;{searchQuery}&quot;
                </p>
                <p className="text-[14px] text-[var(--color-muted)] mt-1">
                  Try adjusting your search terms
                </p>
              </>
            ) : activeStatus !== 'all' ? (
              <>
                <FileText size={32} className="text-[var(--color-muted)] mb-4 opacity-50" />
                <p className="text-[15px] font-medium text-[var(--color-text)]">
                  No {activeStatus.replace('_', ' ')} articles
                </p>
              </>
            ) : (
              <>
                <FileText size={32} className="text-[var(--color-muted)] mb-4 opacity-50" />
                <p className="text-[15px] font-medium text-[var(--color-text)]">
                  No articles yet
                </p>
                <p className="text-[14px] text-[var(--color-muted)] mt-1">
                  Articles you create will appear here.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ASSIGN MODAL */}
      <Modal open={showAssignModal} onOpenChange={(open) => {
        if (!open) {
          setShowAssignModal(false);
          setSelectedStaff(null);
          setAssignNote('');
        }
      }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Assign Article</ModalTitle>
            <ModalDescription className="truncate text-[13px]">
              {selectedArticle?.title}
            </ModalDescription>
          </ModalHeader>
          
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto mt-2 p-1">
            {staff.map(person => {
              const isAssignedToThis = selectedArticle?.assigned_to === person.id;
              const isSelected = selectedStaff === person.id;
              
              return (
                <div 
                  key={person.id}
                  onClick={() => setSelectedStaff(person.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isSelected || (isAssignedToThis && selectedStaff === null)
                      ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]' 
                      : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  <div 
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" 
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}
                  >
                    <span className="font-semibold text-[13px]">
                      {person.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-[14px] font-medium text-[var(--color-text)] truncate">{person.full_name}</span>
                    <div className="flex items-center mt-1">
                      {person.role === 'editor' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">Editor</span>}
                      {person.role === 'admin' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Admin</span>}
                      {person.role === 'super_admin' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">Super Admin</span>}
                    </div>
                  </div>
                  
                  {(isSelected || (isAssignedToThis && selectedStaff === null)) && (
                    <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4">
            <textarea
              value={assignNote}
              onChange={e => setAssignNote(e.target.value)}
              placeholder="Add a note for the editor (optional)"
              rows={4}
              className="w-full resize-none rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-[14px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-muted)]"
            />
          </div>

          <ModalFooter>
            <button 
              onClick={() => {
                setShowAssignModal(false);
                setSelectedStaff(null);
                setAssignNote('');
              }}
              className="px-4 py-2 rounded-xl text-[14px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isPending || (!selectedStaff && !selectedArticle?.assigned_to)}
              onClick={() => {
                const assignee = selectedStaff || selectedArticle.assigned_to;
                if (!assignee) return;
                startTransition(async () => {
                  const res = await assignArticle(selectedArticle.id, assignee, assignNote || null);
                  if (res?.error) toast.error(res.error);
                  else {
                    toast.success('Article assigned');
                    setShowAssignModal(false);
                    setSelectedStaff(null);
                    setAssignNote('');
                    router.refresh();
                  }
                });
              }}
              className="px-4 py-2 rounded-xl text-[14px] font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Assigning...' : 'Assign'}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE MODAL */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-red-500">Delete Article</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete "{selectedArticle?.title}"?
              This moves it to Recently Deleted. It can be restored later.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-xl text-[14px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await deleteArticle(selectedArticle.id, false);
                  if (res?.error) toast.error(res.error);
                  else {
                    toast.success('Article deleted');
                    setShowDeleteModal(false);
                    router.refresh();
                  }
                });
              }}
              className="px-4 py-2 rounded-xl text-[14px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </AdminContainer>
  );
}
