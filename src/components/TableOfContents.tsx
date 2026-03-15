'use client';

import { useEffect, useState, useRef } from 'react';
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
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex flex-col justify-end" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-fade-in" />
          <div 
            className="relative w-full max-w-2xl mx-auto bg-[var(--color-surface)] rounded-t-[3.5rem] p-9 pb-12 shadow-[0_-20px_100px_rgba(0,0,0,0.5)] max-h-[85vh] flex flex-col animate-toc-up border-x border-t border-[var(--color-border)]/50"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-16 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-10 opacity-30 shrink-0" />
            
            <div className="flex items-center justify-between mb-10 shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-3xl bg-[var(--color-primary)]/10 flex items-center justify-center shadow-inner">
                  <List size={28} className="text-[var(--color-primary)]" strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Table of Contents</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-[var(--color-primary)] rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-70">Navigation summary</p>
                  </div>
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
        </div>
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
    <nav className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollTo(item.id)}
          className={`group flex items-center justify-between text-left transition-all duration-500 rounded-2xl border
            ${isDrawer ? 'px-6 py-4.5' : 'px-4 py-3'}
            ${item.level === 1 ? 'border-transparent' : item.level === 2 ? 'ml-6' : 'ml-10'}
            ${activeId === item.id
              ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/5 font-black border-[var(--color-primary)]/20 shadow-sm scale-[1.02]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] font-bold border-transparent opacity-70 hover:opacity-100 hover:ml-1'
            }`}
        >
          <span className={`${isDrawer ? 'text-[15px]' : 'text-[12px]'} leading-snug tracking-tight`}>{item.text}</span>
          <div className="flex items-center gap-3">
             {activeId === item.id && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
            )}
            <ChevronRight size={16} className={`shrink-0 transition-transform duration-500 ${activeId === item.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-40'}`} />
          </div>
        </button>
      ))}
    </nav>
  );
}
