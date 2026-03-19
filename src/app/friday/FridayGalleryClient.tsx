'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, Share2, X, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from '@/lib/toast';

type FridayMessage = {
  id: string;
  title: string | null;
  image_url: string | null;
  message_text: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

/* ── Lightbox ───────────────────────────── */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px]"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <div
        className="relative max-w-2xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="object-contain w-full max-h-[90vh] rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  );
}

/* ── Poster Card ───────────────────────── */
function PosterCard({ msg }: { msg: FridayMessage }) {
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const label = msg.title || 'Friday Message';
  const imageUrl = msg.image_url || '';
  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/friday`
    : 'https://sathyadhare.com/friday';

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `friday-message-${msg.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: label, url: pageUrl });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy image URL to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
      } catch {
        const t = document.createElement('textarea');
        t.value = imageUrl;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
      }
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const date = new Date(msg.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <>
      {lightbox && imageUrl && (
        <Lightbox src={imageUrl} alt={label} onClose={() => setLightbox(false)} />
      )}

      <div className="flex flex-col gap-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden group hover:border-[var(--color-primary)]/30 hover:shadow-xl transition-all duration-300">
        
        {/* Image */}
        <div
          className="relative aspect-square overflow-hidden cursor-pointer bg-[var(--color-surface-2)]"
          onClick={() => imageUrl && setLightbox(true)}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] opacity-30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </div>
          )}
          
          {/* Overlay hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3.5 py-3 gap-2">
          <p className="text-[12px] font-bold text-[var(--color-muted)] truncate">{date}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              disabled={!imageUrl}
              title="Download"
              className="flex items-center gap-1 h-8 px-3 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-[11px] font-bold uppercase tracking-wider"
            >
              <Download size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!imageUrl}
              title="Share"
              className="flex items-center gap-1 h-8 px-3 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors text-[11px] font-bold uppercase tracking-wider"
            >
              {copied ? <Check size={13} strokeWidth={3} /> : <Share2 size={13} strokeWidth={2.5} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main Client Component ───────────────── */
export default function FridayGalleryClient({ initialMessages }: { initialMessages: FridayMessage[] }) {
  const [messages, setMessages] = useState<FridayMessage[]>(initialMessages);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = messages.length === page * PAGE_SIZE;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/friday-messages?page=${page + 1}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      if (data.messages?.length) {
        setMessages(prev => [...prev, ...data.messages]);
        setPage(p => p + 1);
      }
    } catch {
      toast.error('Failed to load more.');
    }
    setLoadingMore(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {messages.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <p className="text-[15px] font-bold text-[var(--color-text)]">No Messages Yet</p>
          <p className="text-[14px] text-[var(--color-muted)]">Friday messages will appear here when published.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {messages.map(msg => (
              <PosterCard key={msg.id} msg={msg} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="h-12 px-8 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[14px] font-bold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors active:scale-95"
              >
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
