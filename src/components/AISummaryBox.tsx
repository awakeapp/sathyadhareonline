'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Pause, Play, Square, Sliders } from 'lucide-react';

/* ─── AI Summary ──────────────────────────────────────────── */
interface AISummaryBoxProps {
  articleId: string;
  content: string;
  title: string;
  existingSummary?: string | null;
}

function AISummaryPill({ articleId, content, title, existingSummary }: AISummaryBoxProps) {
  const [summary, setSummary] = useState<string | null>(existingSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, content, title }),
      });
      const data = await res.json();
      if (!res.ok || !data.summary) throw new Error(data.error || 'Failed');
      setSummary(data.summary);
      setExpanded(true);
    } catch { setError('Could not generate. Try again.'); }
    finally { setLoading(false); }
  };

  if (!content || content.length < 300) return null;

  return (
    <div className="flex-1 min-w-0">
      {/* Single pill row — strictly no overflow */}
      <div className={`flex items-center h-12 px-4 gap-3 rounded-2xl border transition-all overflow-hidden ${
        summary ? 'bg-[#685de6]/6 border-[#685de6]/20' : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}>

        {/* Icon */}
        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
          summary ? 'bg-[#685de6] text-white' : 'bg-[var(--color-surface-2)] text-[#685de6]'
        }`}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-[8px] font-black uppercase tracking-[0.17em] text-[#685de6] leading-none mb-0.5">AI Summary</p>
          <p className="text-[11px] font-semibold text-[var(--color-text)] truncate leading-none">
            {loading
              ? 'Generating…'
              : error
              ? 'Failed — tap retry'
              : summary
              ? summary.slice(0, 55) + (summary.length > 55 ? '…' : '')
              : 'Get an instant AI summary'}
          </p>
        </div>

        {/* Action — shrink-0 so it never compresses */}
        <div className="shrink-0 flex items-center gap-1.5">
          {!summary && !loading && (
            <button
              onClick={generate}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-[#685de6] text-white text-[9px] font-black uppercase tracking-wider hover:bg-[#5548d4] active:scale-95 transition-all shadow-md shadow-[#685de6]/25"
            >
              <Wand2 size={11} />
              Generate
            </button>
          )}
          {error && !loading && (
            <button onClick={generate} className="p-1.5 rounded-lg text-[#685de6] hover:bg-[#685de6]/10 transition-colors">
              <RotateCcw size={13} />
            </button>
          )}
          {summary && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable summary */}
      {expanded && summary && (
        <div className="mt-2 px-4 py-3.5 bg-[#685de6]/5 border border-[#685de6]/20 rounded-2xl">
          <p className="text-[13px] leading-relaxed text-[var(--color-text)] font-medium">
            &ldquo;{summary}&rdquo;
          </p>
          <p className="mt-2.5 text-[8px] font-black uppercase tracking-widest text-[#685de6]/50">Gemini 1.5 Flash</p>
        </div>
      )}
    </div>
  );
}

export default AISummaryPill;
