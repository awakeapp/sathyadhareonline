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

  headings.forEach((el, index) => {
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
    setItems(extracted);

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />
          <div 
            className="relative w-full max-w-2xl mx-auto bg-[var(--color-surface)] rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_80px_rgba(0,0,0,0.4)] max-h-[85vh] flex flex-col animate-toc-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-8 opacity-40 shrink-0" />
            
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <List size={20} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Table of Contents</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mt-0.5">Quick Navigation</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:text-rose-500 transition-colors"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>

            <div className="overflow-y-auto pr-2 scrollbar-none">
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
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollTo(item.id)}
          className={`group flex items-center justify-between text-left transition-all duration-300 rounded-2xl
            ${isDrawer ? 'px-5 py-4' : 'px-3 py-2.5'}
            ${item.level === 1 ? '' : item.level === 2 ? 'ml-4' : 'ml-8'}
            ${activeId === item.id
              ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-black ring-1 ring-[var(--color-primary)]/20'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] font-bold'
            }`}
        >
          <span className={`${isDrawer ? 'text-sm' : 'text-[11px]'} leading-tight`}>{item.text}</span>
          {activeId === item.id && (
            <ChevronRight size={14} className="shrink-0 animate-pulse" />
          )}
        </button>
      ))}
    </nav>
  );
}
