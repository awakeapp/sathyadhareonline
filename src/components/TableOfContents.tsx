'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { List, X, ChevronRight } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentHtml: string;
}

function extractHeadings(html: string): TocItem[] {
  if (typeof window === 'undefined') return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const headings = div.querySelectorAll('h1, h2, h3, h4');
  const items: TocItem[] = [];

  const generateId = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 50);

  headings.forEach((el) => {
    const level = parseInt(el.tagName[1]);
    const text = el.textContent?.trim() || '';
    if (!text) return;

    const id = el.id || generateId(text);
    items.push({ id, level, text });
  });

  return items;
}

export default function TableOfContents({ contentHtml }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const extracted = extractHeadings(contentHtml);
    requestAnimationFrame(() => {
      setItems(extracted);
    });

    observerRef.current?.disconnect();
    if (extracted.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    extracted.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [contentHtml]);

  // Handle Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Listen for external toggle event
  useEffect(() => {
    const handler = () => { if (items.length >= 2) setIsOpen(prev => !prev); };
    window.addEventListener('toggle-toc', handler);
    return () => window.removeEventListener('toggle-toc', handler);
  }, [items.length]);

  if (items.length < 2) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a small offset if needed, but smooth scroll handles it
      setActiveId(id);
      setIsOpen(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toc-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-toc-up { animation: toc-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .prose-article h1, .prose-article h2, .prose-article h3, .prose-article h4, .prose-article h5, .prose-article h6 {
          scroll-margin-top: calc(var(--safe-top, 0px) + 90px);
        }
      `}} />

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:block sticky top-24 w-64 shrink-0 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 scrollbar-none">
        <div className="p-6 rounded-[2.5rem] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <List size={16} strokeWidth={3} className="text-[var(--color-primary)]" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]">Summary</h3>
          </div>
          <TocList items={items} activeId={activeId} scrollTo={scrollTo} />
        </div>
      </aside>

      {/* Modern Drawer (Mobile / Triggered) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1200] flex flex-col justify-end" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" />
          <div 
            className="relative w-full max-w-2xl mx-auto bg-[var(--color-surface)] rounded-t-[3.5rem] p-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] shadow-[0_-20px_100px_rgba(0,0,0,0.5)] max-h-[85vh] flex flex-col animate-toc-up border-x border-t border-[var(--color-border)]/50"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-16 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-6 opacity-30 shrink-0" />
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-3xl bg-[var(--color-primary)]/10 flex items-center justify-center shadow-inner">
                  <List size={28} className="text-[var(--color-primary)]" strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Index</h3>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:text-rose-500 hover:bg-rose-500/5 transition-all active:scale-90 border border-[var(--color-border)]/50 shadow-sm"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <div className="overflow-y-auto pr-2 scrollbar-none custom-scrollbar pb-6">
              <TocList items={items} activeId={activeId} scrollTo={scrollTo} isDrawer />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function TocList({ items, activeId, scrollTo, isDrawer = false }: { 
  items: TocItem[]; 
  activeId: string; 
  scrollTo: (id: string) => void;
  isDrawer?: boolean;
}) {
  return (
    <nav className="relative flex flex-col items-stretch">
      {/* Background vertical continuous track */}
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[var(--color-border)] rounded-full" />
      
      {items.map((item, index) => {
        const isActive = activeId === item.id;
        // Indentation logic
        const pl = item.level <= 1 ? 'pl-6' : item.level === 2 ? 'pl-10' : 'pl-14';
        const isLast = index === items.length - 1;

        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`group relative flex items-center justify-between text-left transition-all duration-300 w-full rounded-r-2xl
              ${isDrawer ? 'py-4 pr-4' : 'py-3 pr-2'} ${pl}
              ${!isLast ? 'border-b border-[var(--color-border)]/50' : ''}
              ${isActive
                ? 'text-[var(--color-primary)] font-black bg-[var(--color-primary)]/5'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] font-bold opacity-80 hover:opacity-100'
              }`}
          >
            {/* The active vertical indicator overlaying the track */}
            {isActive && (
              <div className="absolute left-[6px] top-0 bottom-0 w-[4px] bg-[var(--color-primary)] rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)] z-10" />
            )}
            <div className="flex items-start gap-2 overflow-hidden w-full">
              <ChevronRight size={14} strokeWidth={3} className={`shrink-0 mt-1 transition-transform ${isActive ? 'text-[var(--color-primary)] translate-x-1' : 'text-[var(--color-muted)] opacity-40 group-hover:translate-x-1 group-hover:opacity-70 group-hover:text-[var(--color-text)]'}`} />
              <span className={`${isDrawer ? 'text-[15px]' : 'text-[13px]'} leading-snug tracking-tight line-clamp-2 pt-[1px]`}>{item.text}</span>
            </div>
            <div className="flex items-center gap-2 pl-2 shrink-0">
               {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
