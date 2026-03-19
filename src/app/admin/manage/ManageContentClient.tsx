'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  FileText, 
  Layers, 
  Book, 
  Mail, 
  Tags, 
  ImageIcon as ImageIconLucide, 
  Video, 
  Mic,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  User as UserIcon,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuPortal,
} from '@/components/ui/Dropdown';
import { 
  PresenceCard, 
  PresenceButton,
} from '@/components/PresenceUI';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import QuickActionMenu from '@/components/dashboard/QuickActionMenu';
import { manageContentAction } from './actions';

// Standardized content types
export type ContentType = 'article' | 'sequel' | 'book' | 'friday' | 'category' | 'banner' | 'podcast' | 'banner_video';

export interface BaseContent {
  id: string;
  title: string;
  type: ContentType;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  author_id?: string;
  author_name?: string;
  assigned_to?: string;
  assigned_name?: string;
  created_at: string;
  updated_at?: string;
  image?: string;
  slug?: string;
}

const TABS = [
  { id: 'all', label: 'All Content', icon: FileText },
  { id: 'article', label: 'Articles', icon: FileText },
  { id: 'sequel', label: 'Sequels', icon: Layers },
  { id: 'book', label: 'Library', icon: Book },
  { id: 'friday', label: 'Friday', icon: Mail },
  { id: 'category', label: 'Groups', icon: Tags },
  { id: 'banner', label: 'Banners', icon: ImageIconLucide },
  { id: 'podcast', label: 'Podcasts', icon: Mic },
  { id: 'banner_video', label: 'Videos', icon: Video },
];

const STATUS_META = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-500 border-zinc-200', icon: FileText },
  in_review: { label: 'Review', color: 'bg-amber-50 text-amber-500 border-amber-100', icon: Clock3 },
  published: { label: 'Published', color: 'bg-emerald-50 text-emerald-500 border-emerald-100', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'bg-indigo-50 text-indigo-500 border-indigo-100', icon: Archive },
};

interface Props {
  initialContent: BaseContent[];
  currentUser: { id: string; role: string };
  users: { id: string; full_name: string }[];
}

export default function ManageContentClient({ initialContent, currentUser, users }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BaseContent | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync tab with URL if needed
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const filteredContent = useMemo(() => {
    return initialContent.filter(item => {
      const matchTab = activeTab === 'all' || item.type === activeTab;
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.author_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [initialContent, activeTab, searchQuery]);

  // Unified Action Handler
  const handleItemAction = async (item: BaseContent, action: 'archive' | 'delete' | 'assign', payload?: any) => {
    startTransition(async () => {
      const res = await manageContentAction(item.id, item.type as any, action, payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Content ${action}d successfully`);
        if (action === 'delete') setShowDeleteModal(false);
        if (action === 'assign') setShowAssignModal(false);
        router.refresh();
      }
    });
  };

  const getEditLink = (item: BaseContent) => {
    switch (item.type) {
      case 'article': return `/admin/articles/${item.id}/edit`;
      case 'sequel': return `/admin/sequels`; 
      case 'book': return `/admin/library/${item.id}`;
      case 'friday': return `/admin/friday`;
      case 'banner': return `/admin/banners`;
      case 'category': return `/admin/categories`;
      case 'podcast': return `/admin/manage?tab=podcast`;
      case 'banner_video': return `/admin/manage?tab=banner_video`;
      default: return '#';
    }
  };

  const canEdit = (item: BaseContent) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;
    if (currentUser.role === 'editor') {
       return item.author_id === currentUser.id || item.assigned_to === currentUser.id;
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── Action Header ── */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
          <input 
            type="text" 
            placeholder="Search all content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] outline-none transition-all"
          />
        </div>
        <PresenceButton 
          onClick={() => setIsActionMenuOpen(true)}
          className="h-11 px-5 rounded-xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
        >
          <Plus size={18} className="mr-2" /> New
        </PresenceButton>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap border text-xs font-bold uppercase tracking-wider transition-all
                ${isActive 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md' 
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]'}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Feed ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredContent.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[var(--color-surface)] rounded-[2.5rem] border border-dashed border-[var(--color-border)]">
            <p className="text-[var(--color-muted)] text-sm font-bold uppercase tracking-widest">No matching content found</p>
          </div>
        ) : (
          filteredContent.map((item) => {
            const status = STATUS_META[item.status] || STATUS_META.draft;
            const isMine = item.author_id === currentUser.id || item.assigned_to === currentUser.id;
            const editable = canEdit(item);

            return (
              <div key={item.id} className="group relative h-full">
                <div className={`flex flex-col p-4 bg-[var(--color-surface)] rounded-[2rem] border transition-all duration-300 h-full
                  ${editable ? 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-xl' : 'border-dashed border-[var(--color-border)] opacity-80'}`}>
                  
                  {/* Item Type & Status */}
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-muted)]">
                          {(() => {
                            const TabIcon = TABS.find(t => t.id === item.type)?.icon || FileText;
                            return <TabIcon size={14} />;
                          })()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                         {status.label}
                       </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent align="end" className="w-48 bg-[var(--color-surface)] border-[var(--color-border)] shadow-xl rounded-xl p-1">
                          <DropdownMenuLabel className="px-3 py-2 text-[10px] uppercase font-black opacity-40">Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                             <Link href={getEditLink(item)} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold hover:bg-[var(--color-surface-2)]">
                               <Edit2 size={14} className="mr-2" /> {editable ? 'Edit' : 'View'}
                             </Link>
                          </DropdownMenuItem>
                          {editable && (
                            <>
                              <DropdownMenuItem onClick={() => { setSelectedItem(item); setShowAssignModal(true); }} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold hover:bg-[var(--color-surface-2)]">
                                <Users size={14} className="mr-2" /> Assign To
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleItemAction(item, 'archive')} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold text-indigo-500 hover:bg-indigo-50">
                                <Archive size={14} className="mr-2" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="opacity-10" />
                              <DropdownMenuItem onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-50">
                                <Trash2 size={14} className="mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenu>
                  </div>

                  {/* Title & Content */}
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[var(--color-text)] leading-tight mb-2 line-clamp-2">
                      {item.title || 'Untitled'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-tighter">
                         <UserIcon size={12} />
                         {item.author_name || 'Admin'}
                       </div>
                       {item.assigned_name && (
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-tighter">
                           <Users size={12} />
                           Asgn: {item.assigned_name}
                         </div>
                       )}
                       <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]/50 uppercase tracking-tighter">
                         <Clock size={12} />
                         {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                       </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                     <Link href={getEditLink(item)} className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary)] flex items-center hover:translate-x-1 transition-transform">
                       Quick Edit <ChevronRight size={14} />
                     </Link>
                     {isMine && (
                       <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-sm shadow-[var(--color-primary)]/50 animate-pulse" title="Assigned to you" />
                     )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <QuickActionMenu 
        isOpen={isActionMenuOpen} 
        onClose={() => setIsActionMenuOpen(false)} 
        permissions={null}
      />

      <Modal open={showAssignModal} onOpenChange={setShowAssignModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Assign Task</ModalTitle>
            <ModalDescription>Assign "{selectedItem?.title}" to a team member for editing or review.</ModalDescription>
          </ModalHeader>
          <div className="grid grid-cols-1 gap-2 pt-4">
             {users.map(u => (
               <button 
                 key={u.id}
                 disabled={isPending}
                 onClick={() => selectedItem && handleItemAction(selectedItem, 'assign', { assigned_to: u.id })}
                 className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)] transition-all text-left disabled:opacity-50"
               >
                 <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs uppercase">
                   {u.full_name.charAt(0)}
                 </div>
                 <span className="text-sm font-bold">{u.full_name}</span>
               </button>
             ))}
          </div>
          <ModalFooter>
             <PresenceButton variant="outline" onClick={() => setShowAssignModal(false)} disabled={isPending}>Cancel</PresenceButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-rose-500">Confirm Deletion</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete "{selectedItem?.title}"? This action moves it to the trash.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
             <PresenceButton variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isPending}>Cancel</PresenceButton>
             <PresenceButton 
               className="bg-rose-500 text-white" 
               loading={isPending}
               onClick={() => selectedItem && handleItemAction(selectedItem, 'delete')}
             >
               Delete Forever
             </PresenceButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
