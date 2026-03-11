'use client';

import { useState, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import {
  Plus, Edit2, Trash2, Tag, AlertCircle, ChevronUp,
  ChevronDown, GripVertical, FileText, Loader2, FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

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

/* ── helpers ───────────────────────────────────────────────────────── */
function toSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PILL_COLORS = [
  { text: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
  { text: '#60a5fa', bg: 'rgba(37,99,235,0.15)'  },
  { text: '#34d399', bg: 'rgba(16,185,129,0.15)'  },
  { text: '#f472b6', bg: 'rgba(236,72,153,0.15)'  },
  { text: '#fbbf24', bg: 'rgba(245,158,11,0.15)'  },
  { text: '#fb923c', bg: 'rgba(234,88,12,0.15)'   },
  { text: '#38bdf8', bg: 'rgba(14,165,233,0.15)'  },
];

/* ── field row used in both Create and Edit modals ─────────────────── */
function Field({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--color-muted)] opacity-70">{hint}</p>}
    </div>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className={`bg-black/20 border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)]/60 rounded-xl h-11 font-medium ${props.className ?? ''}`}
    />
  );
}

function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl border border-[var(--color-border)] bg-black/20 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 outline-none focus:border-[var(--color-primary)]/60 transition-colors resize-none font-medium ${props.className ?? ''}`}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════ */
export default function CategoryManagerClient({ categories: initial }: Props) {
  const [cats, setCats] = useState<Category[]>(
    [...initial].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [isPending, startTransition] = useTransition();
  const [reordering, setReordering] = useState(false);

  /* ── Create modal ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  /* ── Edit modal ── */
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');

  /* ── Delete modal ── */
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  /* ── helpers ── */
  const resetCreate = () => {
    setCreateName(''); setCreateSlug(''); setCreateDesc(''); setSlugTouched(false);
  };

  const openEdit = useCallback((cat: Category) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDesc(cat.description ?? '');
  }, []);

  /* ──────────────────────────────────────────────────────────────────
     CREATE
  ────────────────────────────────────────────────────────────────── */
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
      toast.success(`"${newCat.name}" created successfully.`);
    });
  };

  /* ──────────────────────────────────────────────────────────────────
     UPDATE
  ────────────────────────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────────────────────────
     DELETE
  ────────────────────────────────────────────────────────────────── */
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

      const name = deleteTarget.name;
      setCats(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(`"${name}" deleted.`);
    });
  };

  /* ──────────────────────────────────────────────────────────────────
     REORDER (up / down)
  ────────────────────────────────────────────────────────────────── */
  const move = useCallback((idx: number, dir: -1 | 1) => {
    const newCats = [...cats];
    const target = idx + dir;
    if (target < 0 || target >= newCats.length) return;
    [newCats[idx], newCats[target]] = [newCats[target], newCats[idx]];
    // Re-assign contiguous sort_orders
    const withOrder = newCats.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setCats(withOrder);

    // Persist
    setReordering(true);
    const payload = withOrder.map(c => ({ id: c.id, sort_order: c.sort_order }));
    fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: payload }),
    })
      .then(r => r.json())
      .then(j => {
        if (!j.ok) toast.error('Reorder save failed');
      })
      .catch(() => toast.error('Reorder network error'))
      .finally(() => setReordering(false));
  }, [cats]);

  /* ──────────────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--color-text)]">
            All Categories
            <span className="ml-2 text-sm font-bold text-[var(--color-muted)]">({cats.length})</span>
          </h2>
          <p className="text-xs text-[var(--color-muted)] font-medium mt-0.5">
            Drag to reorder. Changes persist immediately.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full h-10 px-5 font-bold shadow-lg"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Category
        </Button>
      </div>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {cats.length === 0 && (
        <Card className="py-24 text-center flex flex-col items-center bg-[var(--color-surface)] border-dashed border-[var(--color-border)] rounded-[2rem] shadow-none">
          <FolderOpen className="w-14 h-14 mb-5 opacity-20 text-[var(--color-muted)]" />
          <p className="font-black text-lg tracking-tight">No categories yet</p>
          <p className="text-sm text-[var(--color-muted)] mt-1 mb-6">
            Create your first category to start organising content.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="rounded-full px-6">
            <Plus className="w-4 h-4 mr-1.5" /> Create Category
          </Button>
        </Card>
      )}

      {/* ── Category list ─────────────────────────────────────────── */}
      {cats.length > 0 && (
        <div className="space-y-3">
          {cats.map((cat, idx) => {
            const pill = PILL_COLORS[idx % PILL_COLORS.length];
            return (
              <Card
                key={cat.id}
                className="rounded-3xl border-[var(--color-border)] bg-[var(--color-surface)] shadow-none hover:border-[var(--color-primary)]/30 transition-colors group"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">

                    {/* ── Reorder buttons ── */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0 || reordering}
                        aria-label="Move up"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === cats.length - 1 || reordering}
                        aria-label="Move down"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* ── Drag-handle visual (cosmetic) ── */}
                    <GripVertical
                      size={16}
                      className="flex-shrink-0 text-[var(--color-muted)] opacity-30 hidden sm:block"
                    />

                    {/* ── Colour avatar ── */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black"
                      style={{ background: pill.bg, color: pill.text }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>

                    {/* ── Info ── */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-[15px] text-[var(--color-text)] truncate">
                          {cat.name}
                        </span>
                        {cat.article_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: pill.bg, color: pill.text }}>
                            <FileText size={9} />
                            {cat.article_count} {cat.article_count === 1 ? 'article' : 'articles'}
                          </span>
                        )}
                        {cat.article_count === 0 && (
                          <span className="text-[10px] font-semibold text-[var(--color-muted)] opacity-60">
                            No articles
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <code className="text-[11px] font-mono text-[var(--color-muted)] bg-white/5 px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                          /{cat.slug}
                        </code>
                        {cat.description && (
                          <span className="text-[11px] text-[var(--color-muted)] truncate max-w-xs hidden sm:block">
                            {cat.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Sort badge ── */}
                    <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-[var(--color-border)] flex-shrink-0">
                      <span className="text-[11px] font-black text-[var(--color-muted)]">
                        {cat.sort_order}
                      </span>
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => openEdit(cat)}
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 font-bold px-3"
                      >
                        <Edit2 size={13} className="sm:mr-1.5" />
                        <span className="hidden sm:inline text-xs">Edit</span>
                      </Button>
                      <Button
                        onClick={() => setDeleteTarget(cat)}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 rounded-xl p-0 text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30"
                        aria-label="Delete"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Description on mobile */}
                  {cat.description && (
                    <p className="sm:hidden text-[11px] text-[var(--color-muted)] mt-2.5 pl-[calc(14px+8px+44px+16px)] leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══ CREATE MODAL ════════════════════════════════════════════════ */}
      <Modal open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) resetCreate(); }}>
        <ModalContent className="sm:max-w-lg p-0 border-[var(--color-border)] rounded-[2rem] overflow-hidden bg-[var(--color-surface)]">
          <ModalHeader className="bg-black/20 p-6 border-b border-[var(--color-border)]">
            <ModalTitle className="flex items-center gap-2 text-lg font-black">
              <Tag size={18} className="text-[var(--color-primary)]" />
              New Category
            </ModalTitle>
            <ModalDescription className="text-xs text-[var(--color-muted)] mt-1">
              Fill in the details below. Slug auto-generates from name.
            </ModalDescription>
          </ModalHeader>

          <div className="p-6 space-y-4">
            <Field label="Category Name">
              <FieldInput
                id="create-name"
                placeholder="e.g. Technology"
                value={createName}
                onChange={e => {
                  setCreateName(e.target.value);
                  if (!slugTouched) setCreateSlug(toSlug(e.target.value));
                }}
                autoFocus
              />
            </Field>

            <Field label="URL Slug" hint="Used in the URL. Lower-case, hyphens only.">
              <FieldInput
                id="create-slug"
                placeholder="e.g. technology"
                value={createSlug}
                className="font-mono text-sm"
                onChange={e => { setSlugTouched(true); setCreateSlug(e.target.value); }}
              />
            </Field>

            <Field label="Description (optional)">
              <FieldTextarea
                id="create-desc"
                placeholder="Brief description of this category…"
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
              />
            </Field>
          </div>

          <ModalFooter className="p-6 bg-black/20 border-t border-[var(--color-border)] gap-2">
            <Button
              variant="outline"
              onClick={() => { setCreateOpen(false); resetCreate(); }}
              className="rounded-xl border-[var(--color-border)] bg-transparent w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || !createSlug.trim() || isPending}
              className="rounded-xl px-8 font-bold w-full sm:w-auto"
            >
              {isPending ? <Loader2 size={15} className="animate-spin mr-2" /> : <Plus size={15} className="mr-2" />}
              Create Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ══ EDIT MODAL ══════════════════════════════════════════════════ */}
      <Modal open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
        <ModalContent className="sm:max-w-lg p-0 border-[var(--color-border)] rounded-[2rem] overflow-hidden bg-[var(--color-surface)]">
          <ModalHeader className="bg-black/20 p-6 border-b border-[var(--color-border)]">
            <ModalTitle className="flex items-center gap-2 text-lg font-black">
              <Edit2 size={18} className="text-blue-400" />
              Edit Category
            </ModalTitle>
            <ModalDescription className="text-xs text-[var(--color-muted)] mt-1">
              Update the details for <strong>{editTarget?.name}</strong>.
            </ModalDescription>
          </ModalHeader>

          <div className="p-6 space-y-4">
            <Field label="Category Name">
              <FieldInput
                id="edit-name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="URL Slug" hint="Changing the slug will break existing URLs.">
              <FieldInput
                id="edit-slug"
                value={editSlug}
                className="font-mono text-sm"
                onChange={e => setEditSlug(e.target.value)}
              />
            </Field>

            <Field label="Description (optional)">
              <FieldTextarea
                id="edit-desc"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Brief description of this category…"
              />
            </Field>
          </div>

          <ModalFooter className="p-6 bg-black/20 border-t border-[var(--color-border)] gap-2">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              className="rounded-xl border-[var(--color-border)] bg-transparent w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editName.trim() || !editSlug.trim() || isPending}
              className="rounded-xl px-8 font-bold w-full sm:w-auto"
            >
              {isPending ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ══ DELETE CONFIRM MODAL ════════════════════════════════════════ */}
      <Modal open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <ModalContent className="sm:max-w-md p-0 border-rose-500/20 rounded-[2rem] overflow-hidden bg-[var(--color-surface)]">
          <ModalHeader className="bg-rose-500/5 p-6 border-b border-rose-500/15">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-rose-400" />
              </div>
              <ModalTitle className="text-lg font-black">Delete Category?</ModalTitle>
            </div>
            <ModalDescription className="text-sm text-[var(--color-muted)] ml-[52px]">
              <strong className="text-[var(--color-text)]">&ldquo;{deleteTarget?.name}&rdquo;</strong> will
              be removed. Articles in this category will become uncategorised.
              {deleteTarget && deleteTarget.article_count > 0 && (
                <span className="block mt-1.5 font-bold text-amber-400">
                  ⚠ {deleteTarget.article_count} {deleteTarget.article_count === 1 ? 'article is' : 'articles are'} currently in this category.
                </span>
              )}
              <span className="block mt-1.5 font-bold text-rose-400 text-xs">
                This action cannot be undone.
              </span>
            </ModalDescription>
          </ModalHeader>

          <ModalFooter className="p-6 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border-[var(--color-border)] bg-transparent w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl px-8 font-bold bg-rose-500 hover:bg-rose-600 text-white border-0 w-full sm:w-auto"
            >
              {isPending ? <Loader2 size={15} className="animate-spin mr-2" /> : <Trash2 size={15} className="mr-2" />}
              Yes, Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
