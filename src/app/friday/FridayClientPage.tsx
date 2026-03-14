'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface FridayMessage {
  id: string;
  title: string | null;
  image_url: string | null;
  message_text: string | null;
  created_at: string;
}

interface Props {
  messages: FridayMessage[];
  initialIndex: number;
}

function formatFridayDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function FridayClientPage({ messages, initialIndex }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const msg = messages[index] ?? null;
  const total = messages.length;

  function go(dir: number) {
    const next = index + dir;
    if (next >= 0 && next < total) setIndex(next);
  }

  return (
    <div className="min-h-[100svh] pb-0 border-t border-[var(--color-border)]">
      {/* Header */}
      <div className="sticky top-[56px] z-40 bg-[var(--color-background)]/95 backdrop-blur-2xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
          <h1 className="text-base font-black text-[var(--color-text)] tracking-tight">Friday Message</h1>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
                {index + 1} / {total}
              </span>
            )}
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider active:scale-95 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              Pick Date
            </button>
          </div>
        </div>
      </div>

      {/* Date picker modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowDatePicker(false)}>
          <div
            className="bg-[var(--color-surface)] rounded-t-3xl w-full max-w-[430px] mx-auto overflow-hidden shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <h3 className="text-[17px] font-black text-[var(--color-text)]">Select a Date</h3>
              <button onClick={() => setShowDatePicker(false)} className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] text-center py-8">No messages published yet.</p>
              ) : (
                messages.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => { setIndex(i); setShowDatePicker(false); }}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] border ${
                      i === index
                        ? 'bg-[#685de6] text-white border-transparent'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[#685de6]/30'
                    }`}
                  >
                    {formatFridayDate(m.created_at)}
                    {m.title && <span className="block text-[11px] opacity-60 mt-0.5 font-normal">{m.title}</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 pt-4 max-w-lg mx-auto">
        {total === 0 ? (
          <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-[var(--color-surface)] border border-[var(--color-border)] mt-4">
            <div className="w-16 h-16 rounded-3xl bg-[#10b981]/5 flex items-center justify-center text-[#10b981] mb-4">
              <Calendar size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-black text-[var(--color-text)] mb-1">No Friday Message Yet</h2>
            <p className="text-sm text-[var(--color-muted)]">Check back on Friday for our weekly message.</p>
          </Card>
        ) : msg ? (
          <div className="flex flex-col">
            {/* Poster — A4 portrait ratio (1:1.414) shown in phone width */}
            <div
              className="w-full rounded-3xl overflow-hidden shadow-2xl relative bg-[var(--color-surface-2)]"
              style={{ aspectRatio: '1080 / 1350' }}
            >
              {msg.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={msg.image_url}
                  alt={msg.title || 'Friday Message'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#685de6]/10 to-[#10b981]/10">
                  {msg.title && (
                    <h2 className="text-2xl font-black text-[var(--color-text)] mb-4">{msg.title}</h2>
                  )}
                  {msg.message_text && (
                    <p className="text-base text-[var(--color-muted)] font-medium leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                  )}
                </div>
              )}
            </div>

            {/* Date label */}
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)] mt-4 mb-4">
              {formatFridayDate(msg.created_at)}
            </p>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => go(1)}
                disabled={index >= total - 1}
                className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12px] font-black uppercase tracking-widest text-[var(--color-text)] disabled:opacity-30 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-[11px] font-bold text-[var(--color-muted)] tabular-nums">
                {index + 1} / {total}
              </span>
              <button
                onClick={() => go(-1)}
                disabled={index <= 0}
                className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-[#685de6] text-white border border-transparent text-[12px] font-black uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all shadow-md shadow-[#685de6]/25"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
