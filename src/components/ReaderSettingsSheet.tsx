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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Appearance">
      <div className="space-y-8 pb-6 px-1">
        
        {/* Typeface Selection */}
        <section>
           <h4 className="text-[10px] font-black tracking-[0.15em] text-[var(--color-muted)] uppercase mb-3 ml-2">Typeface Selection</h4>
           <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[1.25rem] overflow-hidden shadow-sm">
             <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
               <button
                 onClick={() => updateSettings({ fontFamily: 'serif' })}
                 className={`py-4 transition-colors font-serif text-[15px] font-bold ${settings.fontFamily === 'serif' ? 'text-[#685de6] bg-[#685de6]/5' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}
               >
                 ನೋಟೋ ಸೆರಿಫ್
               </button>
               <button
                 onClick={() => updateSettings({ fontFamily: 'sans' })}
                 className={`py-4 transition-colors font-sans text-[15px] font-bold ${settings.fontFamily === 'sans' ? 'text-[#685de6] bg-[#685de6]/5' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}
               >
                 ನೋಟೋ ಸ್ಯಾನ್ಸ್
               </button>
             </div>
             <div className="grid grid-cols-2 divide-x divide-[var(--color-border)]">
               <button
                 onClick={() => updateSettings({ fontFamily: 'modern' })}
                 className={`py-4 transition-colors font-baloo text-[15px] font-bold ${settings.fontFamily === 'modern' ? 'text-[#685de6] bg-[#685de6]/5' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}
               >
                 ಬಾಲೂ ತಮ್ಮ
               </button>
               <button
                 onClick={() => updateSettings({ fontFamily: 'tiro' })}
                 className={`py-4 transition-colors font-tiro text-[15px] font-bold ${settings.fontFamily === 'tiro' ? 'text-[#685de6] bg-[#685de6]/5' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}
               >
                 ಟಿರೋ ಕನ್ನಡ
               </button>
             </div>
           </div>
        </section>

        {/* Text Size */}
        <section>
          <div className="flex items-center gap-2 mb-2 ml-2">
             <h4 className="text-[10px] font-black tracking-[0.15em] text-[var(--color-muted)] uppercase">Text Size</h4>
             <span className="text-[10px] font-black bg-[#685de6]/10 text-[#685de6] px-1.5 py-[1px] rounded inline-flex">{settings.fontSize}pt</span>
          </div>
          <div className="flex items-center gap-4 bg-[var(--color-surface-2)] p-2 rounded-[2rem] border border-[var(--color-border)] shadow-inner">
            <button 
              onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 1) })}
              className="w-14 h-14 bg-[var(--color-surface)] shadow-md rounded-full flex items-center justify-center text-[var(--color-text)] hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            <div className="flex-1 px-2">
               <div className="h-2.5 bg-[var(--color-border)] rounded-full relative overflow-hidden">
                 <div 
                   className="absolute inset-y-0 left-0 bg-[#685de6] transition-all duration-300 ease-out rounded-full"
                   style={{ width: `${((settings.fontSize - 12) / (32 - 12)) * 100}%` }}
                 />
               </div>
            </div>
            <button 
              onClick={() => updateSettings({ fontSize: Math.min(32, settings.fontSize + 1) })}
              className="w-14 h-14 bg-[var(--color-surface)] shadow-md rounded-full flex items-center justify-center text-[var(--color-text)] hover:scale-105 active:scale-95 transition-transform relative"
            >
              <div className="w-4 h-0.5 bg-current rounded-full absolute" />
              <div className="w-0.5 h-4 bg-current rounded-full absolute" />
            </button>
          </div>
        </section>

        {/* Readability Spacing */}
        <section>
          <h4 className="text-[10px] font-black tracking-[0.15em] text-[var(--color-muted)] uppercase mb-3 ml-2">Readability Spacing</h4>
          <div className="flex p-1.5 bg-[var(--color-surface-2)] rounded-[1.5rem] border border-[var(--color-border)] shadow-inner">
            {[
              { label: 'Dense', value: 1.4 },
              { label: 'Standard', value: 1.6 },
              { label: 'Airy', value: 1.85 },
              { label: 'Loose', value: 2.1 }
            ].map((sp) => {
              const isActive = settings.lineHeight === sp.value;
              return (
                <button
                  key={sp.value}
                  onClick={() => updateSettings({ lineHeight: sp.value })}
                  className={`flex-1 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive 
                      ? 'bg-[var(--color-surface)] text-[#685de6] shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-100 z-10 border border-[#685de6]/10' 
                      : 'text-[var(--color-muted)] scale-95 hover:text-[var(--color-text)]'
                  }`}
                >
                  {sp.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Theme Settings Component */}
        <section>
          <h4 className="text-[10px] font-black tracking-[0.15em] text-[var(--color-muted)] uppercase mb-3 ml-2">Page Theme</h4>
          <div className="flex gap-3">
             <button
                onClick={() => { updateSettings({ theme: 'light' }); setTheme('light'); }}
                className={`flex-1 py-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  settings.theme === 'light' ? 'border-[#685de6] bg-[#685de6]/5 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
                }`}
             >
                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-800 font-serif font-bold text-sm">A</div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${settings.theme === 'light' ? 'text-[#685de6]' : 'text-[var(--color-muted)]'}`}>Light</span>
             </button>

             <button
                onClick={() => { updateSettings({ theme: 'sepia' }); setTheme('sepia'); }}
                className={`flex-1 py-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  settings.theme === 'sepia' ? 'border-[#685de6] bg-[#685de6]/5 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
                }`}
             >
                <div className="w-6 h-6 rounded-full bg-[#f4ecd8] border border-[#d4b896] shadow-sm flex items-center justify-center text-[#3d2b1f] font-serif font-bold text-sm">A</div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${settings.theme === 'sepia' ? 'text-[#685de6]' : 'text-[var(--color-muted)]'}`}>Sepia</span>
             </button>

             <button
                onClick={() => { updateSettings({ theme: 'dark' }); setTheme('dark'); }}
                className={`flex-1 py-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  settings.theme === 'dark' ? 'border-[#685de6] bg-[#685de6]/5 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
                }`}
             >
                <div className="w-6 h-6 rounded-full bg-[#181623] border border-gray-700 shadow-sm flex items-center justify-center text-white font-serif font-bold text-sm">A</div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${settings.theme === 'dark' ? 'text-[#685de6]' : 'text-[var(--color-muted)]'}`}>Dark</span>
             </button>
          </div>
        </section>

        <div className="pt-2">
          <button 
            onClick={resetSettings}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-3xl border-2 border-dashed border-[var(--color-border)] text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-muted)] hover:text-[#685de6] hover:border-[#685de6]/50 hover:bg-[#685de6]/5 transition-all outline-none"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
               <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
            Default Settings
          </button>
        </div>

      </div>
    </BottomSheet>
  );
}
