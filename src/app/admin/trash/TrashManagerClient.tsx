'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { 
  Trash2, RotateCcw, FileText, Shapes, 
  MessageSquare, History, Archive 
} from 'lucide-react';
import { restoreItemAction, permanentDeleteAction } from './actions';

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

  const tabs: { id: TrashItem['type']; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'article', label: 'Articles', icon: FileText, count: initialArticles.length },
    { id: 'category', label: 'Categories', icon: Shapes, count: initialCategories.length },
    { id: 'sequel', label: 'Sequels', icon: Archive, count: initialSequels.length },
    { id: 'comment', label: 'Comments', icon: MessageSquare, count: initialComments.length },
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
        toast.success('Action successful');
        setShowDelete(false);
        setSelectedItem(null);
      }
    });
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      
      {/* ── Tabs ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 flex items-center gap-2 px-6 py-4 rounded-3xl border transition-all ${
              activeTab === t.id 
                ? 'bg-[#ffe500] text-black border-[#ffe500] font-black scale-[1.02] shadow-lg shadow-black/10' 
                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] font-bold hover:border-[var(--color-muted)]'
            }`}
          >
            <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-black' : 'text-[var(--color-muted)]'}`} />
            <span className="text-sm">{t.label}</span>
            {t.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === t.id ? 'bg-black/10' : 'bg-black/20'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Items List ── */}
      <div className="space-y-3">
        {currentItems.length === 0 ? (
          <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2.5rem] shadow-none">
             <div className="w-16 h-16 rounded-full bg-[var(--color-background)] flex items-center justify-center opacity-40 mb-4 border-2 border-dashed border-[var(--color-border)]">
                <History className="w-8 h-8" />
             </div>
             <p className="font-black text-xl tracking-tight leading-none mb-1 text-white">Clear Sky</p>
             <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">No deleted {activeTab}s found</p>
          </Card>
        ) : (
          currentItems.map((item) => {
            const title = item.title || item.name || item.content?.substring(0, 40) + '...';
            const subtitle = item.guest_name ? `by ${item.guest_name}` : (item.articles?.title ? `on ${item.articles.title}` : '');

            return (
              <Card key={item.id} className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                  
                  <div className="flex-1 min-w-0 w-full">
                     <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-sm truncate leading-tight text-white">{title}</h3>
                     </div>
                     {subtitle && <p className="text-xs text-[var(--color-muted)] truncate mb-0.5 font-medium">{subtitle}</p>}
                     <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest opacity-70">
                        Deleted {formatDate(item.deleted_at)}
                     </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] justify-end">
                     <form action={(fd) => handleAction(restoreItemAction, fd)}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="type" value={activeTab} />
                        <Button variant="outline" size="sm" type="submit" loading={isPending} className="rounded-xl h-9 border-[var(--color-border)] text-emerald-500 hover:bg-emerald-500/10">
                           <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                        </Button>
                     </form>
                     <Button variant="outline" size="sm" className="rounded-xl h-9 border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedItem(item); setShowDelete(true); }}>
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Purge
                     </Button>
                  </div>

                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Confirm Permanent Delete Modal ── */}
      <Modal open={showDelete} onOpenChange={setShowDelete}>
        <ModalContent>
          {selectedItem && (
            <>
              <ModalHeader>
                <ModalTitle className="text-red-500">Permanent Wipeout?</ModalTitle>
                <ModalDescription>
                  This will PERMANENTLY ERASE <span className="text-white font-bold">&quot;{selectedItem.title || selectedItem.name || 'this item'}&quot;</span> from the servers. 
                  This is irreversible. Recovering will be impossible.
                </ModalDescription>
              </ModalHeader>
              <form action={(fd) => handleAction(permanentDeleteAction, fd)}>
                <input type="hidden" name="id" value={selectedItem.id} />
                <input type="hidden" name="type" value={selectedItem.type} />
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDelete(false)} disabled={isPending}>Abort</Button>
                  <Button type="submit" variant="destructive" loading={isPending} className="font-black">Purge Forever</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}
