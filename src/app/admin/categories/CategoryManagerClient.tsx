'use client';

import { useState, useTransition } from 'react';

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
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editIcon, setEditIcon] = useState('');
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
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-semibold">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* ── Category list ────────────────────────────────────────── */}
      {cats.length === 0 ? (
        <div className="py-20 text-center text-[var(--color-muted)] flex flex-col items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-lg">
          <p className="font-semibold text-white mb-1">No categories found</p>
          <p className="text-sm">Create your first category to organize content.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cats.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-lg relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-colors"
            >
              {/* Color avatar */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-inner relative ${COLORS[idx % COLORS.length]}`}>
                <svg className="w-5 h-5 absolute opacity-30" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                <span className="relative z-10">{cat.name.charAt(0).toUpperCase()}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-bold text-white text-[16px] truncate mb-1">{cat.name}</h3>
                <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)] font-mono bg-black/30 w-fit rounded-md px-2 py-0.5">
                  <span className="opacity-50">/</span>
                  <span>{cat.slug}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ EDIT MODAL ══════════════════════════════════════════════ */}
      {editTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeEdit}>
          <div className="w-full max-w-md bg-[var(--color-background)] border border-[var(--color-border)] rounded-3xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Edit Category</h2>
              <button onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Name</label>
                <input
                  required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">URL Slug</label>
                <input
                  required value={editSlug} onChange={e => setEditSlug(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Icon Name <span className="font-normal normal-case opacity-50">(optional)</span></label>
                <input
                  value={editIcon} onChange={e => setEditIcon(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEdit}
                  className="flex-1 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[#ffed4a] transition-colors disabled:opacity-60">
                  {isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm bg-[var(--color-background)] border border-red-500/30 rounded-3xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Delete Category?</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Are you sure you want to delete <span className="font-bold text-white">"{deleteTarget.name}"</span>? Articles in this category will become uncategorized.
            </p>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isPending}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">
                {isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
