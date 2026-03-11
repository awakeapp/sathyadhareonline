'use client';

import { useState, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import {
  Plus, Edit2, Trash2, Tag, AlertCircle, ChevronUp,
  ChevronDown, GripVertical, FileText, Loader2, FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  sort_order: number;
  article_count: number;
}

interface Props { categories: Category[] }

function toSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PILL_COLORS = [
  { text: '#5c4ae4', bg: 'rgba(92,74,228,0.1)' },
  { text: '#2dd4bf', bg: 'rgba(45,212,191,0.1)' },
  { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { text: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
];

export default function CategoryManagerClient({ categories: initial }: Props) {
  const [cats, setCats] = useState<Category[]>(
    [...initial].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [isPending, startTransition] = useTransition();
  const [reordering, setReordering] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const resetCreate = () => {
    setCreateName(''); setCreateSlug(''); setCreateDesc(''); setSlugTouched(false);
  };

  const openEdit = useCallback((cat: Category) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDesc(cat.description ?? '');
  }, []);

  const handleCreate = () => {
    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          slug: createSlug.trim(),
          description: createDesc.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Create failed'); return; }

      const newCat: Category = { ...json.category, article_count: 0 };
      setCats(prev => [...prev, newCat]);
      setCreateOpen(false);
      resetCreate();
      toast.success(`"${newCat.name}" created.`);
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          name: editName.trim(),
          slug: editSlug.trim(),
          description: editDesc.trim() || null,
          icon_name: editTarget.icon_name,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Update failed'); return; }

      setCats(prev => prev.map(c =>
        c.id === editTarget.id
          ? { ...c, name: editName.trim(), slug: editSlug.trim(), description: editDesc.trim() || null }
          : c
      ));
      setEditTarget(null);
      toast.success(`"${editName.trim()}" updated.`);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Delete failed'); setDeleteTarget(null); return; }

      setCats(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Category removed.');
    });
  };

  const move = useCallback((idx: number, dir: -1 | 1) => {
    const newCats = [...cats];
    const target = idx + dir;
    if (target < 0 || target >= newCats.length) return;
    [newCats[idx], newCats[target]] = [newCats[target], newCats[idx]];
    const withOrder = newCats.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setCats(withOrder);

    setReordering(true);
    const payload = withOrder.map(c => ({ id: c.id, sort_order: c.sort_order }));
    fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: payload }),
    })
      .then(r => r.json())
      .catch(() => toast.error('Reorder update failed'))
      .finally(() => setReordering(false));
  }, [cats]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="text-center sm:text-left">
           <h2 className="text-xl font-black text-[#1b1929] dark:text-white">Active Taxonomy</h2>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Structure & Navigation</p>
        </div>
        <PresenceButton onClick={() => setCreateOpen(true)} className="h-11 px-6 bg-[#5c4ae4]">
           <Plus className="w-5 h-5 mr-2" /> New Category
        </PresenceButton>
      </div>

      <div className="space-y-4">
        {cats.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <FolderOpen className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-gray-400 uppercase tracking-widest">No Categories</p>
            <PresenceButton onClick={() => setCreateOpen(true)} className="mt-8 bg-indigo-50 !text-[#5c4ae4] hover:bg-indigo-100 shadow-none">
              Initialise Taxonomy
            </PresenceButton>
          </PresenceCard>
        ) : (
          cats.map((cat, idx) => {
             const pill = PILL_COLORS[idx % PILL_COLORS.length];
             const initials = cat.name.charAt(0).toUpperCase();

             return (
               <PresenceCard key={cat.id} noPadding className="group active:scale-[0.99] transition-all">
                  <div className="p-5 flex flex-col md:flex-row items-center gap-5">
                     
                     <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => move(idx, -1)} disabled={idx === 0 || reordering} className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#5c4ae4] disabled:opacity-20 transition-all">
                           <ChevronUp className="w-5 h-5" />
                        </button>
                        <button onClick={() => move(idx, 1)} disabled={idx === cats.length - 1 || reordering} className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#5c4ae4] disabled:opacity-20 transition-all">
                           <ChevronDown className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-sm" style={{ backgroundColor: pill.bg, color: pill.text }}>
                        {initials}
                     </div>

                     <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
                           <p className="font-black text-xl tracking-tight text-[#1b1929] dark:text-white truncate">{cat.name}</p>
                           <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                              /{cat.slug}
                           </span>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-5 gap-y-1">
                           <span className="text-xs font-bold text-gray-400">{cat.article_count} Articles Published</span>
                           {cat.description && (
                             <span className="text-[11px] font-medium text-gray-400 italic truncate max-w-[200px]">{cat.description}</span>
                           )}
                        </div>
                     </div>

                     <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
                        <button onClick={() => openEdit(cat)} className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] hover:bg-[#5c4ae4] hover:text-white transition-all">
                           <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteTarget(cat)} className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>

                  </div>
               </PresenceCard>
             );
          })
        )}
      </div>

      {/* ── MODALS ── */}
      <Modal open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) resetCreate(); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>New Category</ModalTitle>
            <ModalDescription>Organise your content structure.</ModalDescription>
          </ModalHeader>
          <div className="space-y-4 pt-2 text-left">
             <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-gray-400">Name</label>
               <Input placeholder="e.g. Science" value={createName} onChange={e => { setCreateName(e.target.value); if(!slugTouched) setCreateSlug(toSlug(e.target.value)); }} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-gray-400">Slug</label>
               <Input value={createSlug} onChange={e => { setSlugTouched(true); setCreateSlug(e.target.value); }} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-gray-400">Description</label>
               <textarea rows={3} className="w-full rounded-2xl bg-gray-50 dark:bg-white/5 border-none p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20" placeholder="Optional details..." value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
             </div>
             <ModalFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!createName.trim() || isPending} className="bg-[#5c4ae4] text-white">Create Category</Button>
             </ModalFooter>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Category</ModalTitle>
            <ModalDescription>Updating {editTarget?.name}</ModalDescription>
          </ModalHeader>
          <div className="space-y-4 pt-2 text-left">
             <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-gray-400">Name</label>
               <Input value={editName} onChange={e => setEditName(e.target.value)} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-gray-400">Slug</label>
               <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-gray-400">Description</label>
               <textarea rows={3} className="w-full rounded-2xl bg-gray-50 dark:bg-white/5 border-none p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
             </div>
             <ModalFooter>
                <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={isPending} className="bg-[#5c4ae4] text-white">Save Changes</Button>
             </ModalFooter>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <ModalContent>
           <ModalHeader>
              <ModalTitle className="text-rose-500">Delete Category?</ModalTitle>
              <ModalDescription>
                 Are you sure? Articles in <span className="font-bold">{deleteTarget?.name}</span> will be uncategorised.
              </ModalDescription>
           </ModalHeader>
           <ModalFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>No, Keep</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Yes, Delete</Button>
           </ModalFooter>
        </ModalContent>
      </Modal>

    </>
  );
}
