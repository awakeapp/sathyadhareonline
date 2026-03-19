'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Target, BookOpen, ShieldCheck, Lightbulb, Globe, Handshake, History, Sparkles, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import PageContainer from '@/components/layout/PageContainer';

export default function AboutPage() {
  return (
    <main className="min-h-[100dvh] relative overflow-hidden bg-[var(--color-background)] pb-[calc(var(--bottom-nav-height)+1rem)] selection:bg-[var(--color-primary)] selection:text-white">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <PageContainer size="wide" className="relative z-10 !px-6">

        {/* Top Navigation */}
        <div className="flex items-center justify-between py-8 sticky top-0 bg-[var(--color-background)]/40 backdrop-blur-xl z-50 -mx-6 px-6">
          <Link href="/" className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[var(--color-surface)]/50 border border-[var(--color-border)]/50 hover:bg-[var(--color-surface)] transition-all active:scale-95 group rugged-shadow">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)] group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold text-[var(--color-text)]">ಮುಖಪುಟಕ್ಕೆ</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 group cursor-help">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Premium Experience</span>
          </div>
        </div>

        {/* Hero Section */}
        <header className="mt-12 mb-20">
          <div className="flex flex-col items-center sm:items-start transition-all animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest mb-8 shadow-lg shadow-[var(--color-primary)]/20">
              <BookOpen className="w-3.5 h-3.5" />
              ನಮ್ಮ ಬಗ್ಗೆ
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-[var(--color-text)] leading-[1.1] tracking-tight mb-8 font-kannada-modern">
               ಸತ್ಯಧಾರೆ: <br />
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 bg-clip-text text-transparent">
                ಸತ್ಯದ ಹರಿವು.
              </span>
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-[var(--color-muted)] leading-relaxed max-w-2xl font-kannada-serif">
              {"ಕನ್ನಡಿಗರ ಆಧ್ಯಾತ್ಮಿಕ ಮತ್ತು ಶೈಕ್ಷಣಿಕ ಅಗತ್ಯಗಳನ್ನು ಪೂರೈಸುವ ಅಧಿಕೃತ ಧ್ವನಿ. 'ಸಮಸ್ತ'ದ ಶ್ರೀಮಂತ ಪರಂಪರೆಯನ್ನು ಮನೆಮನಗಳಿಗೆ ತಲುಪಿಸುವ ಡಿಜಿಟಲ್ ಪಯಣ."}
            </p>
          </div>
        </header>

        {/* Vision & Mission Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-24">
          <Card className="p-10 border border-[var(--color-border)]/30 bg-[var(--color-surface)]/60 backdrop-blur-md rounded-[2.5rem] flex flex-col gap-6 group hover:border-[var(--color-primary)]/40 transition-all duration-500 hover:-translate-y-1 rugged-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-[var(--color-text)] font-kannada-modern">ನಮ್ಮ ದೃಷ್ಟಿಕೋನ</h3>
            <p className="text-md font-medium text-[var(--color-muted)] leading-relaxed font-kannada-serif">
              {"ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ ಸಾಂಪ್ರದಾಯಿಕ ಇಸ್ಲಾಮಿಕ್ ಜ್ಞಾನದ ಅತ್ಯಂತ ವಿಶ್ವಾಸಾರ್ಹ ಡಿಜಿಟಲ್ ಕೇಂದ್ರವಾಗುವುದು. ಬೌದ್ಧಿಕವಾಗಿ ಸಶಕ್ತವಾದ ನವ ಪೀಳಿಗೆಯನ್ನು ರೂಪಿಸುವುದು."}
            </p>
          </Card>

          <Card className="p-10 border border-[var(--color-border)]/30 bg-[var(--color-surface)]/60 backdrop-blur-md rounded-[2.5rem] flex flex-col gap-6 group hover:border-orange-500/40 transition-all duration-500 hover:-translate-y-1 rugged-shadow">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-[var(--color-text)] font-kannada-modern">ನಮ್ಮ ಧ್ಯೇಯ</h3>
            <p className="text-md font-medium text-[var(--color-muted)] leading-relaxed font-kannada-serif">
              {"ಕನ್ನಡ ಮಾತನಾಡುವ ಜಗತ್ತಿಗೆ ನೈಜ ಮತ್ತು ನಿಖರವಾದ ಇಸ್ಲಾಮಿಕ್ ಜ್ಞಾನ ತಲುಪಿಸುವುದು. ಧಾರ್ಮಿಕ ಸಂಕೀರ್ಣತೆಗಳನ್ನು ಸರಳೀಕರಿಸಿ, ನೈತಿಕ ಮೌಲ್ಯಗಳನ್ನು ಉನ್ನತೀಕರಿಸುವುದು."}
            </p>
          </Card>
        </div>

        {/* Visual Timeline Section */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-[var(--color-text)] font-kannada-modern">ನಮ್ಮ ಪಯಣ</h2>
          </div>

          <div className="space-y-12 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-border)] to-transparent hidden sm:block" />
            
            {/* Timeline Item 1 */}
            <div className="flex flex-col sm:flex-row gap-8 relative animate-fade-up">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border-4 border-[var(--color-primary)] flex items-center justify-center z-10 hidden sm:flex shrink-0 rugged-shadow" />
              <div className="glass-premium p-8 rounded-3xl border border-[var(--color-border)]/50 rugged-shadow flex-1">
                <span className="text-xs font-black text-[var(--color-primary)] uppercase tracking-wider mb-2 block">1997 • ಆರಂಭ</span>
                <p className="text-md font-semibold text-[var(--color-text)] leading-relaxed font-kannada-serif">
                  {"'ಸಮಸ್ತ ಕೇರಳ ಸುನ್ನಿ ಸ್ಟೂಡೆಂಟ್ಸ್ ಫೆಡರೇಶನ್' (SKSSF) ನ ಮಲಯಾಳಂ ಮುಖವಾಣಿಯಾಗಿ ಆರಂಭವಾಗಿ, ಅಲ್ಪಾವಧಿಯಲ್ಲೇ ಅಧಿಕೃತ ಧ್ವನಿಯಾಗಿ ಹೊರಹೊಮ್ಮಿತು."}
                </p>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="flex flex-col sm:flex-row gap-8 relative animate-fade-up [animation-delay:100ms]">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border-4 border-orange-500 flex items-center justify-center z-10 hidden sm:flex shrink-0 rugged-shadow" />
              <div className="glass-premium p-8 rounded-3xl border border-[var(--color-border)]/50 rugged-shadow flex-1">
                <span className="text-xs font-black text-orange-500 uppercase tracking-wider mb-2 block">2013 • ಕನ್ನಡ ಆವೃತ್ತಿ</span>
                <p className="text-md font-semibold text-[var(--color-text)] leading-relaxed font-kannada-serif">
                  {"'SKSSF ಕರ್ನಾಟಕ ಸ್ಟೇಟ್' ಸಮಿತಿಯ ನೇತೃತ್ವದಲ್ಲಿ ಮೊದಲ ಕನ್ನಡ ಮುದ್ರಣ ಆವೃತ್ತಿಯನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸಲಾಯಿತು. ಇದು ಇತಿಹಾಸದಲ್ಲಿ ಒಂದು ಪ್ರಮುಖ ಹೆಜ್ಜೆಯಾಗಿತ್ತು."}
                </p>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="flex flex-col sm:flex-row gap-8 relative animate-fade-up [animation-delay:200ms]">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border-4 border-emerald-500 flex items-center justify-center z-10 hidden sm:flex shrink-0 rugged-shadow" />
              <div className="glass-premium p-8 rounded-3xl border border-[var(--color-border)]/50 rugged-shadow flex-1">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-wider mb-2 block">ಇಂದು • ಡಿಜಿಟಲ್ ರೂಪಾಂತರ</span>
                <p className="text-md font-semibold text-[var(--color-text)] leading-relaxed font-kannada-serif">
                  {"ಜಗತ್ತಿನಾದ್ಯಂತ ಇರುವ ಪ್ರತಿಯೊಬ್ಬ ಕನ್ನಡಿಗೂ ನೈಜ ಇಸ್ಲಾಮಿಕ್ ಜ್ಞಾನವನ್ನು ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ತಲುಪಿಸುವ ಡಿಜಿಟಲ್ ಪಯಣ ಆರಂಭವಾಗಿದೆ."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Redesign */}
        <section className="mb-24 px-8 py-16 rounded-[3rem] bg-[var(--color-surface)]/40 border border-[var(--color-border)]/30 rugged-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Award className="w-64 h-64 text-[var(--color-primary)]" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-[var(--color-text)] mb-12 text-center font-kannada-modern">ನಮ್ಮ ಮೂಲ ಮೌಲ್ಯಗಳು</h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {[
                { 
                  icon: <ShieldCheck className="w-6 h-6" />, 
                  title: "ಅಚಲ ನೈಜತೆ", 
                  color: "bg-blue-500/10 text-blue-500",
                  content: "'ಸಮಸ್ತ'ದ ಸಾಂಪ್ರದಾಯಿಕ ಬೋಧನೆಗಳು ಮತ್ತು ಫತ್ವಾಗಳಿಗೆ ಬದ್ಧರಾಗಿ, ಧಾರ್ಮಿಕ ನಿಖರತೆಗೆ ಅತ್ಯುನ್ನತ ಆದ್ಯತೆ ನೀಡುವುದು." 
                },
                { 
                  icon: <Lightbulb className="w-6 h-6" />, 
                  title: "ಬೌದ್ಧಿಕ ಸ್ಪಷ್ಟತೆ", 
                  color: "bg-amber-500/10 text-amber-500",
                  content: "ಆಳವಾದ ಸಂಶೋಧನೆ ಮತ್ತು ವಿದ್ವಾಂಸರ ಒಮ್ಮತದ ಆಧಾರದ ಮೇಲೆ ಸೈದ್ಧಾಂತಿಕ ಅಪಪ್ರಚಾರಗಳನ್ನು ಖಂಡಿಸಿ, ಸತ್ಯವನ್ನು ಬಿತ್ತರಿಸುವುದು." 
                },
                { 
                  icon: <Globe className="w-6 h-6" />, 
                  title: "ಸುಲಭ ಲಭ್ಯತೆ", 
                  color: "bg-emerald-500/10 text-emerald-500",
                  content: "ಆಧುನಿಕ ವೆಬ್ ತಂತ್ರಜ್ಞಾನವನ್ನು ಬಳಸಿ, ನೈಜ ಇಸ್ಲಾಮಿಕ್ ಸಾಹಿತ್ಯವು ಎಲ್ಲರಿಗೂ ಉಚಿತವಾಗಿ ಬೆರಳ ತುದಿಯಲ್ಲೇ ಸಿಗುವಂತೆ ಮಾಡುವುದು." 
                },
                { 
                  icon: <Handshake className="w-6 h-6" />, 
                  title: "ಸಾಂಸ್ಕೃತಿಕ ಸಾಮರಸ್ಯ", 
                  color: "bg-purple-500/10 text-purple-500",
                  content: "ಕರ್ನಾಟಕದ ವಿಶಾಲ ಸಮಾಜಕ್ಕೆ ಸಕಾರಾತ್ಮಕ ಕೊಡುಗೆ ನೀಡುವ ಪ್ರಬುದ್ಧ ಸಮುದಾಯವನ್ನು ನಿರ್ಮಿಸುವುದು." 
                }
              ].map((value, i) => (
                <div key={i} className="flex gap-6 p-6 sm:p-8 rounded-3xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors border border-[var(--color-border)]/50 group">
                  <div className={`w-14 h-14 rounded-2xl ${value.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    {value.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[var(--color-text)] mb-2 font-kannada-modern">{value.title}</h4>
                    <p className="text-sm font-semibold text-[var(--color-muted)] leading-relaxed font-kannada-serif">{value.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center pb-12">
          <div className="p-12 sm:p-20 rounded-[3rem] bg-gradient-to-br from-[var(--color-primary)] to-indigo-700 text-white relative overflow-hidden rugged-shadow">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-black mb-6 font-kannada-modern">ನೀವೂ ಭಾಗವಹಿಸಲು ಬಯಸುವಿರಾ?</h2>
              <p className="text-white/80 font-bold mb-10 max-w-sm font-kannada-serif">ನಿಮ್ಮ ಸಾಹಿತ್ಯಿಕ ಕೊಡುಗೆಗಳ ಮೂಲಕ ಸತ್ಯಧಾರೆ ಕುಟುಂಬದ ಭಾಗವಾಗಿರಿ.</p>
              <Link href="/write" className="group relative px-12 py-5 rounded-full bg-white text-[var(--color-primary)] font-black uppercase tracking-widest text-sm hover:scale-110 active:scale-95 transition-all shadow-2xl">
                 ನಿಮ್ಮ ಲೇಖನ ಹಂಚಿಕೊಳ್ಳಿ
              </Link>
            </div>
          </div>
        </section>

      </PageContainer>
    </main>
  );
}
