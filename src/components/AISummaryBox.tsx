'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, Wand2, Info } from 'lucide-react';

interface AISummaryBoxProps {
  articleId: string;
  content: string;
  title: string;
  existingSummary?: string | null;
  compact?: boolean;
}

export default function AISummaryBox({ articleId, content, title, existingSummary, compact = false }: AISummaryBoxProps) {
  const [summary, setSummary] = useState<string | null>(existingSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(compact && !!existingSummary);
  const [generated, setGenerated] = useState(!!existingSummary);

  const generateSummary = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, content, title }),
      });

      const data = await res.json();
      if (!res.ok || !data.summary) throw new Error(data.error || 'Failed to generate');
      setSummary(data.summary);
      setGenerated(true);
      setCollapsed(false);
    } catch {
      setError('Could not generate summary. Check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!content || content.length < 300) return null;

  return (
    <div className={`relative transition-all duration-700 ${
      generated 
        ? 'bg-gradient-to-br from-[#685de6]/5 via-white to-[#685de6]/5 dark:from-[#685de6]/10 dark:via-zinc-900 dark:to-[#685de6]/10 border-[#685de6]/30' 
        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
    } border rounded-[2rem] overflow-hidden group shadow-sm`}>
      
      {/* Decorative Aura */}
      {generated && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#685de6]/10 blur-[60px] pointer-events-none" />
      )}

      {/* Header */}
      <div 
        className={`flex items-center gap-4 px-6 py-4 cursor-pointer select-none ${generated ? '' : 'pointer-events-none'}`}
        onClick={() => generated && setCollapsed(!collapsed)}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          generated ? 'bg-[#685de6] text-white shadow-xl rotate-0' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
        }`}>
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Sparkles size={20} className={generated ? 'animate-pulse' : ''} />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${generated ? 'text-[#685de6]' : 'text-zinc-500'}`}>
              {loading ? 'Synthesizing...' : 'AI Insights'}
            </span>
            {generated && !loading && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#685de6]/10 text-[#685de6] text-[8px] font-black uppercase tracking-widest">
                Flash 1.5
              </span>
            )}
          </div>
          <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
            {generated ? 'Article Summary' : 'AI-Powered Quick Summary'}
          </h4>
        </div>

        {generated ? (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors">
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        ) : !loading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              generateSummary();
            }}
            className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-[#685de6] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#685de6]/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Wand2 size={14} />
            Generate
          </button>
        )}
      </div>

      {/* Progress bar during loading */}
      {loading && (
        <div className="absolute bottom-0 left-0 h-1 bg-[#685de6] animate-[shimmer_2s_infinite] w-full origin-left" />
      )}

      {/* Body Content */}
      {(!collapsed || loading) && (
        <div className="px-6 pb-6 pt-2 animate-fade-in">
          {loading ? (
            <div className="space-y-3">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-[90%] animate-pulse" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full animate-pulse" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-[70%] animate-pulse" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
              <Info size={16} className="text-rose-500" />
              <p className="text-xs font-semibold text-rose-600 flex-1">{error}</p>
              <button onClick={generateSummary} className="text-[10px] font-black uppercase text-[#685de6] hover:underline">Retry</button>
            </div>
          ) : summary ? (
            <div className="relative">
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[#685de6]/20 rounded-full" />
              <p className="text-[15px] leading-relaxed font-semibold text-zinc-700 dark:text-zinc-300 pl-4 italic">
                &ldquo;{summary}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#685de6]" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    AI Analysis Complete
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(0.5); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
