'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Highlighter, Trash2, Calendar, Layout, ChevronRight, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Highlight {
  id: string;
  content: string;
  created_at: string;
  article: {
    title: string;
    slug: string;
  };
}

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHighlights = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('article_highlights')
        .select(`
          id,
          content,
          created_at,
          article:articles (
            title,
            slug
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      interface DBHighlight {
        id: string;
        content: string;
        created_at: string;
        article: {
          title: string;
          slug: string;
        }[];
      }

      setHighlights((data as unknown as DBHighlight[] || []).map((h) => ({
        id: h.id,
        content: h.content,
        created_at: h.created_at,
        article: Array.isArray(h.article) ? h.article[0] : h.article
      })) as Highlight[]);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load highlights');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  async function deleteHighlight(id: string) {
    try {
      const { error } = await supabase
        .from('article_highlights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHighlights(highlights.filter(h => h.id !== id));
      toast.success('Highlight deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete highlight');
    }
  }

  const shareHighlight = (h: Highlight) => {
    const text = `"${h.content}" — found on Sathyadhare: ${window.location.origin}/articles/${h.article.slug}`;
    if (navigator.share) {
      navigator.share({
        title: 'Article Highlight',
        text: text,
      });
    } else {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Loading Your Vault</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pt-6 sm:pt-10 pb-24 px-4 sm:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <Link 
              href="/profile" 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-6"
            >
              <ArrowLeft size={14} /> Back to Profile
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xl shadow-[var(--color-primary)]/20">
                <Highlighter size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">Highlight Vault</h1>
                <p className="text-sm font-medium text-[var(--color-muted)] mt-1">Your curated collection of wisdom</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 py-4 px-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Total</p>
              <p className="text-2xl font-black tabular-nums">{highlights.length}</p>
            </div>
            <div className="w-px h-10 bg-[var(--color-border)]" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Impact</p>
              <p className="text-2xl font-black text-[var(--color-primary)]">LUX</p>
            </div>
          </div>
        </header>

        {highlights.length === 0 ? (
          <div className="p-16 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center opacity-60">
            <Layout size={48} className="text-[var(--color-muted)] mb-6" />
            <h3 className="text-xl font-black mb-2">Your Vault is Empty</h3>
            <p className="text-sm font-medium max-w-xs leading-relaxed">
              Start reading and select any text to highlight it. Your favorites will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {highlights.map((h) => (
              <div 
                key={h.id} 
                className="group relative p-6 sm:p-8 rounded-[2.5rem] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-2xl hover:shadow-[var(--color-primary)]/5 transition-all duration-500"
              >
                <div className="flex flex-col gap-6">
                  {/* Article Reference */}
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/articles/${h.article.slug}`}
                      className="flex items-center gap-2 group/link"
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] group-hover/link:text-[var(--color-primary)] transition-colors">
                        {h.article.title}
                      </span>
                      <ChevronRight size={12} className="text-[var(--color-muted)] opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all" />
                    </Link>
                    <span className="text-[9px] font-bold text-[var(--color-muted)] flex items-center gap-1.5 opacity-60">
                      <Calendar size={10} />
                      {format(new Date(h.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 rounded-full bg-[var(--color-primary)]/20" />
                    <p className="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-[1.6] leading-relaxed font-kannada-serif italic">
                      &quot;{h.content}&quot;
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => shareHighlight(h)}
                      className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-all"
                      title="Share Highlight"
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteHighlight(h.id)}
                      className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                      title="Delete Highlight"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
