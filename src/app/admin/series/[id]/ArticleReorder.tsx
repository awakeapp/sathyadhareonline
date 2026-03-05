'use client';

import { useState } from 'react';

interface Article {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
}

interface AttachedArticle {
  article_id: string;
  order_index: number;
}

interface Props {
  allArticles: Article[];
  attached: AttachedArticle[];
  seriesId: string;
  seriesTitle: string;
  saveAction: (formData: FormData) => Promise<void>;
}

export default function ArticleReorder({ allArticles, attached, saveAction }: Props) {
  // Build initial ordered list from attached, then append un-attached
  const attachedIds   = new Set(attached.map((a) => a.article_id));
  const orderedAttached = [...attached]
    .sort((a, b) => a.order_index - b.order_index)
    .map((a) => allArticles.find((art) => art.id === a.article_id)!)
    .filter(Boolean);

  const [selected, setSelected]     = useState<Article[]>(orderedAttached);
  const [available, setAvailable]   = useState<Article[]>(
    allArticles.filter((a) => !attachedIds.has(a.id))
  );
  const [draggedFrom, setDraggedFrom] = useState<'selected' | 'available' | null>(null);
  const [draggedIdx, setDraggedIdx]   = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Add article to series ─────────────────────────────────────
  const addArticle = (article: Article) => {
    setAvailable((prev) => prev.filter((a) => a.id !== article.id));
    setSelected((prev) => [...prev, article]);
  };

  // ── Remove article from series ───────────────────────────────
  const removeArticle = (article: Article) => {
    setSelected((prev) => prev.filter((a) => a.id !== article.id));
    setAvailable((prev) => [article, ...prev]);
  };

  // ── Drag handlers (reorder within selected) ──────────────────
  const onDragStart = (idx: number, list: 'selected' | 'available') => {
    setDraggedFrom(list);
    setDraggedIdx(idx);
  };

  const onDragOverSelected = (idx: number) => {
    if (draggedFrom !== 'selected') return;
    setDragOverIdx(idx);
  };

  const onDropSelected = (targetIdx: number) => {
    if (draggedFrom !== 'selected' || draggedIdx === null) return;
    if (draggedIdx === targetIdx) { reset(); return; }

    const updated = [...selected];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setSelected(updated);
    reset();
  };

  const reset = () => {
    setDraggedFrom(null);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // ── Move up / down ───────────────────────────────────────────
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= selected.length) return;
    const updated = [...selected];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setSelected(updated);
  };

  return (
    <form action={saveAction} className="space-y-8">
      {/* Hidden inputs carry the ordered IDs */}
      {selected.map((a) => (
        <input key={a.id} type="hidden" name="article_ids" value={a.id} />
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Left: Series order ─────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
              In Series
            </h3>
            <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {selected.length} articles
            </span>
          </div>

          {selected.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 border-2 border-dashed border-white/8 rounded-2xl text-white/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <p className="text-xs">Add articles from the right</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selected.map((article, idx) => (
                <div
                  key={article.id}
                  draggable
                  onDragStart={() => onDragStart(idx, 'selected')}
                  onDragOver={(e) => { e.preventDefault(); onDragOverSelected(idx); }}
                  onDrop={() => onDropSelected(idx)}
                  onDragEnd={reset}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                    dragOverIdx === idx && draggedFrom === 'selected'
                      ? 'border-blue-500/60 bg-blue-500/10 scale-[1.01]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-white/20'
                  }`}
                >
                  {/* Position number */}
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 text-[11px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* Drag handle */}
                  <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>

                  {/* Title */}
                  <span className="flex-1 text-sm font-semibold text-white/80 leading-tight line-clamp-2 min-w-0">{article.title}</span>

                  {/* Up / Down */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" disabled={idx === 0} onClick={() => move(idx, -1)}
                      className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-colors">
                      <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button type="button" disabled={idx === selected.length - 1} onClick={() => move(idx, 1)}
                      className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-colors">
                      <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  {/* Remove */}
                  <button type="button" onClick={() => removeArticle(article)}
                    className="shrink-0 w-7 h-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Available articles ───────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Available Articles
            </h3>
            <span className="text-[10px] font-semibold text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {available.length} remaining
            </span>
          </div>

          {available.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-white/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">All articles are in series</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {available.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => addArticle(article)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left group"
                >
                  <div className="w-7 h-7 rounded-xl bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/80 leading-tight line-clamp-2">{article.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">{article.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Save ────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] text-black font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--color-primary)]/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Save Series Order
        </button>
      </div>
    </form>
  );
}
