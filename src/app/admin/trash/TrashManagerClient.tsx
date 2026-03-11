'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { 
  Trash2, RotateCcw, FileText, Shapes, 
  MessageSquare, History, Archive, AlertTriangle
} from 'lucide-react';
import { restoreItemAction, permanentDeleteAction } from './actions';
import { 
  PresenceCard 
} from '@/components/PresenceUI';

export interface TrashItem {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  guest_name?: string;
  deleted_at: string;
  articles?: { title: string };
  status?: string;
  type: 'article' | 'category' | 'sequel' | 'comment';
}

interface Props {
  initialArticles: TrashItem[];
  initialCategories: TrashItem[];
  initialSequels: TrashItem[];
  initialComments: TrashItem[];
}

export default function TrashManagerClient({ 
  initialArticles, initialCategories, initialSequels, initialComments 
}: Props) {
  const [activeTab, setActiveTab] = useState<TrashItem['type']>('article');
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const tabs: { id: TrashItem['type']; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'article', label: 'Article Cache', icon: FileText, count: initialArticles.length },
    { id: 'category', label: 'Taxonomy', icon: Shapes, count: initialCategories.length },
    { id: 'sequel', label: 'Archives', icon: Archive, count: initialSequels.length },
    { id: 'comment', label: 'Communications', icon: MessageSquare, count: initialComments.length },
  ];

  const currentItems = activeTab === 'article' ? initialArticles : 
                       activeTab === 'category' ? initialCategories : 
                       activeTab === 'sequel' ? initialSequels : initialComments;

  async function handleAction(action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, fd: FormData) {
    startTransition(async () => {
      const res = await action(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('System record updated');
        setShowDelete(false);
        setSelectedItem(null);
      }
      return;
    });
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── Tabs ── */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] transition-all
              ${activeTab === t.id 
                ? 'bg-[#5c4ae4] text-white shadow-xl shadow-indigo-500/30 font-black' 
                : 'bg-white dark:bg-[#1b1929] text-gray-400 font-bold hover:text-[#5c4ae4] hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
            }`}
          >
            <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'text-white' : 'text-gray-300'}`} />
            <span className="text-sm uppercase tracking-wider">{t.label}</span>
            {t.count > 0 && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === t.id ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Items List ── */}
      <div className="space-y-4">
        {currentItems.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
             <History className="w-16 h-16 mb-5 text-indigo-100" />
             <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Archive Void</p>
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">No records found in {activeTab} cache</p>
          </PresenceCard>
        ) : (
          currentItems.map((item) => {
            const title = item.title || item.name || item.content?.substring(0, 40) + '...';
            const subtitle = item.guest_name ? `by ${item.guest_name}` : (item.articles?.title ? `on ${item.articles.title}` : '');

            return (
              <PresenceCard key={item.id} noPadding className="group">
                <div className="p-5 flex flex-col md:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-300 shrink-0">
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0 text-center md:text-left">
                     <h3 className="font-black text-lg text-[#1b1929] dark:text-white truncate">{title}</h3>
                     {subtitle && <p className="text-xs font-bold text-[#5c4ae4] uppercase mt-0.5">{subtitle}</p>}
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Purged · {formatDate(item.deleted_at)}
                     </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                     <form action={(fd) => handleAction(restoreItemAction, fd)}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="type" value={activeTab} />
                        <button type="submit" className="h-12 px-6 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-[#5c4ae4] hover:bg-[#5c4ae4] hover:text-white transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                           <RotateCcw className="w-4 h-4" /> Restore
                        </button>
                     </form>
                     <button className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all" onClick={() => { setSelectedItem(item); setShowDelete(true); }}>
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>

                </div>
              </PresenceCard>
            );
          })
        )}
      </div>

      {/* ── MODAL ── */}
      <Modal open={showDelete} onOpenChange={setShowDelete}>
        <ModalContent>
          {selectedItem && (
            <>
              <ModalHeader>
                <ModalTitle className="text-rose-500">Atomic Purge?</ModalTitle>
                <ModalDescription>
                  Permanently erase <span className="font-black">&ldquo;{selectedItem.title || selectedItem.name || 'this item'}&rdquo;</span>. Irreversible operation.
                </ModalDescription>
              </ModalHeader>

              <form action={(fd) => handleAction(permanentDeleteAction, fd)}>
                <input type="hidden" name="id" value={selectedItem.id} />
                <input type="hidden" name="type" value={selectedItem.type} />
                <ModalFooter>
                  <Button variant="outline" onClick={() => setShowDelete(false)} disabled={isPending}>Abort</Button>
                  <Button type="submit" variant="destructive" disabled={isPending} className="bg-rose-500 font-black">Expunge Forever</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}
