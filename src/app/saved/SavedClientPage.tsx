'use client';

import { useState, useMemo } from 'react';
import { Bookmark, FileText, Calendar, X, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import ArticleCard from '@/components/ui/ArticleCard';
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  category?: { name: string } | { name: string }[] | null;
  savedAt?: string;
}

interface Props { articles: Article[]; }

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function SavedClientPage({ articles }: Props) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  /* All unique dates (YYYY-MM-DD) that have saved articles */
  const savedDates = useMemo(() => {
    const s = new Set<string>();
    articles.forEach(a => { if (a.savedAt) s.add(toDateString(new Date(a.savedAt))); });
    return s;
  }, [articles]);

  /* Filter + sort */
  const filtered = useMemo(() => {
    let list = [...articles];
    if (selectedDate) {
      list = list.filter(a => a.savedAt && toDateString(new Date(a.savedAt)) === selectedDate);
    }
    list.sort((a, b) => {
      const da = new Date(a.savedAt || a.published_at).getTime();
      const db = new Date(b.savedAt || b.published_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return list;
  }, [articles, selectedDate, sortOrder]);

  /* Calendar helpers */
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstWeekday(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(calMonth.year, calMonth.month);
  const firstWeekday = getFirstWeekday(calMonth.year, calMonth.month);
  const monthName = new Date(calMonth.year, calMonth.month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  function prevMonth() {
    setCalMonth(prev => {
      const m = prev.month - 1;
      return m < 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: m };
    });
  }
  function nextMonth() {
    setCalMonth(prev => {
      const m = prev.month + 1;
      return m > 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: m };
    });
  }

  return (
    <div className="min-h-screen pb-0">
      {/* Sticky header */}
      <div className="sticky z-40 bg-[var(--color-surface)]/95 backdrop-blur-xl border-b border-[var(--color-border)] transition-all" style={{ top: 'calc(var(--safe-top) + 56px)' }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#685de6]" />
            <div>
              <h1 className="text-base font-black text-[var(--color-text)] leading-none">Saved Articles</h1>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold uppercase tracking-widest mt-0.5">
                {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
                {selectedDate ? ` on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(p => !p)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {sortOrder === 'oldest' ? 'Oldest' : 'Newest'}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden z-50 min-w-[140px]">
                  {(['newest', 'oldest'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSortOrder(opt); setFilterOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 hover:bg-[var(--color-surface-2)] transition-colors ${sortOrder === opt ? 'text-[#685de6]' : 'text-[var(--color-text)]'}`}
                    >
                      {opt === 'newest' ? 'Newest First' : 'Oldest First'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Calendar */}
            <button
              onClick={() => setShowDatePicker(true)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                selectedDate
                  ? 'bg-[#685de6] text-white border-transparent'
                  : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {selectedDate ? 'Filtered' : 'By Date'}
            </button>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="w-8 h-8 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] bg-[var(--color-surface)] active:scale-90 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar bottom-sheet */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowDatePicker(false)}>
          <div
            className="bg-[var(--color-surface)] rounded-t-3xl w-full max-w-[430px] mx-auto overflow-hidden shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <h3 className="text-[17px] font-black text-[var(--color-text)]">Filter by Date</h3>
              <button onClick={() => setShowDatePicker(false)} className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-5">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] active:scale-90 transition-all">
                  <span className="text-lg font-bold">‹</span>
                </button>
                <span className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">{monthName}</span>
                <button onClick={nextMonth} className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] active:scale-90 transition-all">
                  <span className="text-lg font-bold">›</span>
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest py-1">{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasSaved = savedDates.has(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isToday = toDateString(new Date()) === dateStr;
                  return (
                    <button
                      key={day}
                      disabled={!hasSaved}
                      onClick={() => { setSelectedDate(isSelected ? null : dateStr); setShowDatePicker(false); }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all relative active:scale-90 ${
                        isSelected ? 'bg-[#685de6] text-white' :
                        hasSaved ? 'bg-[#685de6]/10 text-[#685de6] hover:bg-[#685de6]/20' :
                        'text-[var(--color-muted)] opacity-30 cursor-default'
                      }`}
                    >
                      {day}
                      {hasSaved && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#685de6]" />}
                      {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-muted)]" />}
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <button onClick={() => { setSelectedDate(null); setShowDatePicker(false); }}
                  className="mt-4 w-full py-3 rounded-2xl border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] text-center active:scale-95 transition-all">
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Article list */}
      <div className="px-4 pt-4 max-w-lg mx-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center rounded-[2.5rem] bg-[var(--color-surface-2)] border-2 border-dashed border-[var(--color-border)] min-h-[50vh]">
            <div className="w-20 h-20 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-[var(--color-muted)] opacity-50" />
            </div>
            <p className="text-xl font-black text-[var(--color-text)] tracking-tight">
              {selectedDate ? 'No articles saved' : 'No saved articles yet'}
            </p>
            <p className="mt-2 text-[var(--color-muted)] text-sm font-medium mb-10 max-w-[250px] leading-relaxed">
              {selectedDate ? 'Try a different date or clear the filter.' : 'Bookmark articles to find them here later.'}
            </p>
            {!selectedDate && (
              <div className="pb-4">
                <Link href="/articles"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#685de6] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#685de6]/25 active:scale-95 transition-all">
                  Browse Articles
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(article => (
              <ArticleCard key={article.id} variant="list" article={article as unknown as React.ComponentProps<typeof ArticleCard>['article']} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
