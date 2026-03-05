'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MediaItem { id: string; url: string; created_at: string; }

interface Props {
  /** Called with the selected image URL when user picks one */
  onSelect: (url: string) => void;
  /** Called when the modal is dismissed */
  onClose: () => void;
}

export default function MediaPickerModal({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const supabase = createClient();

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('media')
      .select('id, url, created_at')
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  function handleConfirm() {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--color-background)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Media Library</h2>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Select an image to insert</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-muted)]">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-semibold text-white">No images in media library</p>
              <p className="text-xs mt-1">Upload images via the Media Library first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map(item => {
                const isSelected = selected === item.url;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(isSelected ? null : item.url)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? 'border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20 scale-[1.03]'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url} alt="Media"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {/* Date badge */}
                    <div className="absolute bottom-1 left-1">
                      <span className="text-[8px] font-semibold text-white/60 bg-black/50 backdrop-blur-sm px-1 py-0.5 rounded">
                        {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[var(--color-border)] flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white font-semibold text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selected}
            className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[#ffed4a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {selected ? 'Insert Selected Image' : 'Select an Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
