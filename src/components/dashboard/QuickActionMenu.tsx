'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  FileEdit, 
  Layers, 
  Book, 
  Mail, 
  Tags, 
  Image as ImageIcon, 
  Video, 
  Mic,
  LucideIcon
} from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const ACTIONS: QuickAction[] = [
  { label: 'Article', href: '/admin/articles/write', icon: FileEdit, color: '#6366f1' },
  { label: 'Sequel', href: '/admin/sequels/write', icon: Layers, color: '#0ea5e9' },
  { label: 'Library', href: '/admin/library', icon: Book, color: '#10b981' },
  { label: 'Friday Message', href: '/admin/friday/new', icon: Mail, color: '#f59e0b' },
  { label: 'Category', href: '/admin/categories/new', icon: Tags, color: '#8b5cf6' },
  { label: 'Banner', href: '/admin/banners', icon: ImageIcon, color: '#ec4899' },
  { label: 'Banner Video', href: '/admin/banner-videos', icon: Video, color: '#ef4444' },
  { label: 'Podcast', href: '/admin/podcasts', icon: Mic, color: '#14b8a6' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  permissions?: {
    can_articles: boolean;
    can_sequels: boolean;
    can_library: boolean;
  } | null;
}

export default function QuickActionMenu({ isOpen, onClose, permissions }: Props) {
  const [mounted, setMounted] = useState(false);

  // Filter actions based on permissions
  const filteredActions = ACTIONS.filter(action => {
    if (!permissions) return true; // Fallback if not loaded
    if (action.href.includes('/articles') && !permissions.can_articles) return false;
    if (action.href.includes('/sequels') && !permissions.can_sequels) return false;
    if (action.href.includes('/library') && !permissions.can_library) return false;
    // Other items like Friday Message, Banners, etc. are currently super_admin only anyway
    // but we can add more granular toggles if needed.
    return true;
  });

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-300 flex flex-col justify-end ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        className={`relative w-full max-w-[500px] mx-auto bg-white rounded-t-[32px] px-6 pt-6 pb-12 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-zinc-900">Create Quick Action</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-y-8 gap-x-4">
          {filteredActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={onClose}
              className="flex flex-col items-center gap-3 transition-transform active:scale-95 group"
            >
              <div 
                className="w-16 h-16 rounded-[22px] flex items-center justify-center border border-zinc-100 bg-white shadow-sm group-hover:shadow-md transition-shadow"
              >
                <action.icon size={28} strokeWidth={1.5} style={{ color: action.color }} />
              </div>
              <span className="text-[12px] font-semibold text-zinc-600 text-center leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
