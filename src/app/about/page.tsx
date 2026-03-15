'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Target, Users, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center pt-8 p-4 bg-[var(--color-background)]">
      
      <div className="w-full max-w-2xl bg-[var(--color-background)] relative z-10 animate-fade-in">

        {/* Top App Bar */}
        <div className="flex items-center justify-between py-6 sticky top-0 bg-[var(--color-background)]/80 backdrop-blur-md z-20">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--color-surface)] transition-all active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)] group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold text-[var(--color-text)]">Back to Site</span>
          </Link>
        </div>

        {/* Hero Section */}
        <header className="mt-10 mb-16 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            Our Mission
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-text)] leading-[1.05] tracking-tight mb-6">
            Sathyadhare: <br />
            <span className="text-[var(--color-primary)]">The Flow of Truth.</span>
          </h1>
          <p className="text-lg font-bold text-[var(--color-muted)] leading-relaxed max-w-xl">
            Sathyadhare is a premier digital destination for authentic Kannada literature, insightful analysis, and deep-rooted stories that matter to the heart of Karnataka.
          </p>
        </header>

        {/* Vision & Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          <Card className="p-8 border-none bg-[var(--color-surface-2)] rounded-[2rem] flex flex-col gap-4 group hover:bg-[var(--color-primary)]/5 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-[var(--color-text)]">Our Vision</h3>
            <p className="text-sm font-semibold text-[var(--color-muted)] leading-relaxed">
              To revolutionize digital Kannada content by providing a platform that balances modern accessibility with traditional literary depth.
            </p>
          </Card>

          <Card className="p-8 border-none bg-[var(--color-surface-2)] rounded-[2rem] flex flex-col gap-4 group hover:bg-[var(--color-primary)]/5 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-[var(--color-text)]">Core Values</h3>
            <p className="text-sm font-semibold text-[var(--color-muted)] leading-relaxed">
              Integrity, authenticity, and a commitment to preserving the richness of the Kannada language in the digital age.
            </p>
          </Card>
        </div>

        {/* Detailed Story Section */}
        <section className="space-y-12 pb-20">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[var(--color-primary)]/10 rounded-full" />
            <div className="pl-6">
              <h2 className="text-2xl font-black text-[var(--color-text)] mb-4">Our Story</h2>
              <div className="space-y-6 text-sm font-medium text-[var(--color-muted)] leading-[1.8]">
                <p>
                  Sathyadhare began as a vision to create a sanctuary for truth in an age of fragmented information. We believe that stories are the lifeblood of culture, and language is the vessel that carries them.
                </p>
                <p>
                  Today, Sathyadhare has evolved into a comprehensive media platform serving thousands of readers. From investigative journalism and daily columns to deep-dives into literature and philosophy, we bring you content that provokes thought and inspires action.
                </p>
                <p>
                  Our editorial team consists of passionate writers, critics, and thinkers who are dedicated to maintaining the highest standards of journalistic and literary quality.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof / Pillars */}
          <div className="bg-[var(--color-primary)] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-[var(--color-primary)]/20">
            {/* Decorative background element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                <Users className="w-10 h-10" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black mb-2 tracking-tight">Community Driven</h3>
                <p className="text-white/80 font-semibold leading-relaxed">
                  We are not just a publication; we are a community. Every comment, share, and contribution shapes the future of Sathyadhare.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-10 flex flex-col items-center text-center gap-6">
            <div className="w-px h-20 bg-gradient-to-b from-[var(--color-border)] to-transparent" />
            <p className="text-sm font-black uppercase text-[var(--color-muted)] tracking-[0.2em]">Want to contribute?</p>
            <Link href="/write" className="px-10 py-5 rounded-2xl bg-[var(--color-text)] text-[var(--color-background)] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--color-text)]/10">
               Share Your Story
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
