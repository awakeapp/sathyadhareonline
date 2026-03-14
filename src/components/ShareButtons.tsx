'use client';

import { useState } from 'react';
import { Share2, Link as LinkIcon, Check, MessageCircle } from 'lucide-react';

interface Props {
  title: string;
  slug: string;
  children?: React.ReactNode; // Bookmark button goes here (last)
}

export default function ShareButtons({ title, slug, children }: Props) {
  const [copied, setCopied] = useState(false);

  const getUrl = () =>
    `${typeof window !== 'undefined' ? window.location.origin : 'https://sathyadhare.com'}/articles/${slug}`;

  const handleCopy = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSystemShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      try { await navigator.share({ title, url }); }
      catch (e) { console.warn('Share failed', e); }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const url = getUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank');
  };

  /* Common height + flex for every button so they look perfectly balanced */
  const pill = 'flex-1 flex items-center justify-center gap-1.5 h-11 rounded-2xl text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap';

  return (
    <div className="w-full mt-5">
      {/* Row: WhatsApp | Copy | Share | Save — equal-width, full row */}
      <div className="flex items-center gap-2 w-full">
        {/* 1. WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className={`${pill} bg-[#25D366] text-white shadow-sm shadow-[#25D366]/20 hover:brightness-105`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" fill="currentColor" strokeWidth={0} />
          <span>WhatsApp</span>
        </button>

        {/* 2. Copy Link */}
        <button
          onClick={handleCopy}
          className={`${pill} border ${
            copied
              ? 'bg-green-500/10 text-green-600 border-green-500/30'
              : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]/60'
          }`}
        >
          {copied
            ? <Check className="w-4 h-4 shrink-0" />
            : <LinkIcon className="w-4 h-4 shrink-0" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        {/* 3. System Share — square icon tile */}
        <button
          onClick={handleSystemShare}
          className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary)]/60 text-[var(--color-text)] active:scale-95 transition-all"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* 4. Save / Bookmark — same icon tile from children */}
        {children}
      </div>
    </div>
  );
}
