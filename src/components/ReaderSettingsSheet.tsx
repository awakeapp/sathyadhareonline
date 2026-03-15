'use client';

import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { BottomSheet } from './ui/BottomSheet';
import { AlignLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ReaderSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReaderSettingsSheet({ isOpen, onClose }: ReaderSettingsSheetProps) {
  const { settings, updateSettings, resetSettings } = useReaderSettings();
  const { setTheme } = useTheme();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Appearance Settings">
      <div className="space-y-7 pb-8">
        
        {/* Font Size */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-[var(--color-text)] mb-1">ಅಕ್ಷರದ ಗಾತ್ರ (Text Size)</h4>
            <span className="text-xs font-bold bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-1 rounded-md text-[var(--color-muted)]">{settings.fontSize}</span>
          </div>
          <div className="flex items-center gap-4 bg-[var(--color-surface-2)] p-2 rounded-2xl border border-[var(--color-border)]">
            <button 
              onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 1) })}
              className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[var(--color-border)] transition-colors text-lg font-bold"
            >
              A-
            </button>
            <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-[var(--color-primary)] transition-all"
                style={{ width: `${((settings.fontSize - 12) / (32 - 12)) * 100}%` }}
              />
            </div>
            <button 
              onClick={() => updateSettings({ fontSize: Math.min(32, settings.fontSize + 1) })}
              className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[var(--color-border)] transition-colors text-xl font-bold"
            >
              A+
            </button>
          </div>
        </section>

        {/* Font Family */}
        <section>
          <h4 className="text-base font-bold text-[var(--color-text)] mb-3">ಅಕ್ಷರ ಶೈಲಿ (Font Style)</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'serif', kn: 'ನೋಟೋ ಸೆರಿಫ್', en: 'Noto Serif' },
              { id: 'sans', kn: 'ನೋಟೋ ಸ್ಯಾನ್ಸ್', en: 'Noto Sans' },
              { id: 'modern', kn: 'ಬಾಲೂ ತಮ್ಮ', en: 'Baloo Tamma' },
              { id: 'tiro', kn: 'ಟಿರೋ ಕನ್ನಡ', en: 'Tiro Kannada' },
            ].map((f) => {
              const fontClass = f.id === 'serif' ? 'font-serif' : f.id === 'sans' ? 'font-sans' : f.id === 'modern' ? 'font-baloo' : 'font-tiro';
              return (
              <button
                key={f.id}
                onClick={() => updateSettings({ fontFamily: f.id as 'serif' | 'sans' | 'modern' | 'tiro' })}
                className={`p-3 rounded-2xl border-2 text-center transition-all ${
                  settings.fontFamily === f.id 
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-muted)]'
                }`}
              >
                <div className={`text-[17px] leading-tight mb-1 ${fontClass}`}>{f.kn}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">{f.en}</div>
              </button>
            )})}
          </div>
        </section>

        {/* Line Height */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-[var(--color-text)]">ಸಾಲುಗಳ ಅಂತರ (Spacing)</h4>
          </div>
          <div className="flex gap-2">
            {[1.4, 1.6, 1.85, 2.1].map((lh) => (
              <button
                key={lh}
                onClick={() => updateSettings({ lineHeight: lh })}
                className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${
                  settings.lineHeight === lh 
                    ? 'bg-[var(--color-primary)] text-white shadow-md' 
                    : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <AlignLeft size={16 + (lh - 1.4) * 8} />
              </button>
            ))}
          </div>
        </section>

        {/* Theme Toggles */}
        <section>
          <h4 className="text-base font-bold text-[var(--color-text)] mb-3">ಬಣ್ಣ (Theme)</h4>
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
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10 bg-[var(--color-surface-2)] shadow-sm' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                <div className={`w-full aspect-video rounded-xl ${t.bg} ${t.border} border shadow-inner flex items-center justify-center overflow-hidden`}>
                   <span className={`text-2xl font-bold font-sans ${t.text}`}>A</span>
                </div>
                <span className="text-xs font-bold text-[var(--color-text)]">{t.label}</span>
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
