'use client';

import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { BottomSheet } from './ui/BottomSheet';
import { Minus, Plus, AlignLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ReaderSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReaderSettingsSheet({ isOpen, onClose }: ReaderSettingsSheetProps) {
  const { settings, updateSettings, resetSettings } = useReaderSettings();
  const { setTheme } = useTheme();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Reader Appearance">
      <div className="space-y-8 pb-8">
        
        {/* Font Size */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Text Size</h4>
            <span className="text-sm font-bold">{settings.fontSize}px</span>
          </div>
          <div className="flex items-center gap-4 bg-[var(--color-surface-2)] p-2 rounded-2xl border border-[var(--color-border)]">
            <button 
              onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 1) })}
              className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[var(--color-border)] transition-colors"
            >
              <Minus size={18} />
            </button>
            <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-[var(--color-primary)] transition-all"
                style={{ width: `${((settings.fontSize - 12) / (32 - 12)) * 100}%` }}
              />
            </div>
            <button 
              onClick={() => updateSettings({ fontSize: Math.min(32, settings.fontSize + 1) })}
              className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[var(--color-border)] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </section>

        {/* Font Family */}
        <section>
          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)] mb-4">Typography</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'serif', label: 'Classic Serif', class: 'font-serif' },
              { id: 'sans', label: 'Balanced Sans', class: 'font-sans' },
              { id: 'modern', label: 'Modern Baloo', class: 'font-baloo' },
              { id: 'tiro', label: 'Tiro Kannada', class: 'font-tiro' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => updateSettings({ fontFamily: f.id as 'serif' | 'sans' | 'modern' | 'tiro' })}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  settings.fontFamily === f.id 
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-muted)]'
                }`}
              >
                <div className={`text-lg mb-1 ${f.id === 'serif' ? 'font-serif' : f.id === 'sans' ? 'font-sans' : f.id === 'modern' ? 'font-baloo' : 'font-tiro'}`}>Aa</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">{f.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Line Height */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Line Spacing</h4>
            <span className="text-sm font-bold">{settings.lineHeight}x</span>
          </div>
          <div className="flex gap-2">
            {[1.4, 1.6, 1.85, 2.1].map((lh) => (
              <button
                key={lh}
                onClick={() => updateSettings({ lineHeight: lh })}
                className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                  settings.lineHeight === lh 
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                }`}
              >
                <AlignLeft size={16 + (lh - 1.4) * 10} />
              </button>
            ))}
          </div>
        </section>

        {/* Theme Toggles */}
        <section>
          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)] mb-4">Background</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-200' },
              { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', border: 'border-[#e4dcc8]' },
              { id: 'dark', label: 'Dark', bg: 'bg-[#181623]', text: 'text-zinc-100', border: 'border-zinc-800' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  updateSettings({ theme: t.id as 'light' | 'dark' | 'sepia' });
                  setTheme(t.id);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  settings.theme === t.id 
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' 
                    : 'border-transparent'
                }`}
              >
                <div className={`w-full aspect-square rounded-xl ${t.bg} ${t.border} border shadow-sm flex items-center justify-center overflow-hidden`}>
                   <span className={`text-lg font-serif ${t.text}`}>A</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <button 
          onClick={resetSettings}
          className="w-full h-12 rounded-2xl border border-dashed border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
        >
          Reset to default
        </button>

      </div>
    </BottomSheet>
  );
}
