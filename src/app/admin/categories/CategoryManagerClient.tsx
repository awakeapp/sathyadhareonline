'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { Edit2, Trash2, Folder, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
}

interface Props {
  categories: Category[];
}

const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500'];

export default function CategoryManagerClient({ categories: initial }: Props) {
  const [cats, setCats] = useState<Category[]>(initial);
  
  // Edit State
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editIcon, setEditIcon] = useState('');
  
  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditIcon(cat.icon_name ?? '');
    setError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, name: editName, slug: editSlug, icon_name: editIcon || null }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Update failed'); return; }

      setCats(prev => prev.map(c => c.id === editTarget.id
        ? { ...c, name: editName, slug: editSlug, icon_name: editIcon || null }
        : c
      ));
      setSuccessMsg(`"${editName}" updated`);
      setTimeout(() => setSuccessMsg(null), 3000);
      closeEdit();
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Delete failed'); setDeleteTarget(null); return; }

      setCats(prev => prev.filter(c => c.id !== deleteTarget.id));
      setSuccessMsg(`"${deleteTarget.name}" deleted`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeleteTarget(null);
    });
  }

  return (
    <>
      {/* ── Success / Error toasts ──────────────────────────────── */}
      {successMsg && (
        <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5 shadow-none rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm tracking-tight">{successMsg}</span>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/5 shadow-none rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold text-sm tracking-tight">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* ── Category list ────────────────────────────────────────── */}
      {cats.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <Folder className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No categories found</p>
          <p className="text-sm text-[var(--color-muted)]">Create your first category to organize content.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {cats.map((cat, idx) => (
            <Card key={cat.id} hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-5 flex items-center gap-4">
                {/* Color avatar */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl shadow-inner relative ${COLORS[idx % COLORS.length]}`}>
                  <Folder className="w-6 h-6 absolute opacity-30 mix-blend-overlay" />
                  <span className="relative z-10">{cat.name.charAt(0).toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-[17px] truncate tracking-tight">{cat.name}</h3>
                  <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)] font-mono bg-[var(--color-surface-2)] mt-1.5 w-fit rounded-lg px-2.5 py-1 font-medium border border-[var(--color-border)]">
                    <span className="opacity-50">/</span>
                    <span>{cat.slug}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => openEdit(cat)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-500"
                  >
                    <Edit2 className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(cat)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ EDIT MODAL ══════════════════════════════════════════════ */}
      <Modal open={!!editTarget} onOpenChange={(open) => !open && closeEdit()}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Category</ModalTitle>
            <ModalDescription>Make changes to the category details below.</ModalDescription>
          </ModalHeader>

          <form onSubmit={handleUpdate} className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                required value={editName} onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label>URL Slug</Label>
              <Input
                required value={editSlug} onChange={e => setEditSlug(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Icon Name <span className="font-normal normal-case opacity-50">(optional)</span></Label>
              <Input
                value={editIcon} onChange={e => setEditIcon(e.target.value)}
              />
            </div>
          </form>

          <ModalFooter>
             <Button variant="ghost" onClick={closeEdit}>Cancel</Button>
             <Button variant="primary" onClick={handleUpdate} disabled={isPending} loading={isPending}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ══ DELETE CONFIRM MODAL ════════════════════════════════════ */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <ModalContent className="border-red-500/30 shadow-red-500/5">
          <ModalHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <ModalTitle>Delete Category?</ModalTitle>
            </div>
            <ModalDescription className="text-[var(--color-text)]">
               Are you sure you want to delete <span className="font-bold">"{deleteTarget?.name}"</span>? Articles in this category will become uncategorized.
               <br />
               <span className="text-red-500 font-bold text-xs mt-2 block">This action cannot be undone.</span>
            </ModalDescription>
          </ModalHeader>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} loading={isPending}>Yes, Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
