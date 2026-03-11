'use client'

import Link from 'next/link'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center pt-8 p-4 bg-[var(--color-background)]">
      
      <div className="w-full max-w-[480px] bg-[var(--color-background)] rounded-[2.5rem] relative z-10 animate-fade-up">

        {/* Top App Bar with actions */}
        <div className="flex items-center justify-between py-6 sticky top-0 bg-[var(--color-background)]/80 backdrop-blur-md z-20">
          <Link href="/signup" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-text)]" />
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="text-[var(--color-text)] hover:text-[#f04a4c] transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button className="text-[var(--color-text)] hover:text-[#f04a4c] transition-colors">
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Header */}
        <div className="mb-10 mt-4">
          <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight mb-2">Terms &<br />Agreement</h1>
        </div>

        {/* Content area matching the clean, highly-legible design in Screen 12 */}
        <div className="space-y-8 pb-16">
          <section>
            <p className="text-[13px] leading-relaxed text-[var(--color-muted)] font-medium">
              These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Sathyadhare ("we," "us" or "our"), concerning your access to and use of the Sathyadhare website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--color-muted)] font-medium mt-4">
              You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms and Conditions. If you do not agree with all of these Terms and Conditions, then you are expressly prohibited from using the Site and you must discontinue use immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-[var(--color-text)] mb-3">Property Rights</h2>
            <p className="text-[13px] leading-relaxed text-[var(--color-muted)] font-medium">
              Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--color-muted)] font-medium mt-4">
              The Content and the Marks are provided on the Site "AS IS" for your information and personal use only. Except as expressly provided in these Terms and Conditions, no part of the Site and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
            </p>
          </section>
          
          <section>
            <h2 className="text-base font-extrabold text-[var(--color-text)] mb-3">User Representations</h2>
            <p className="text-[13px] leading-relaxed text-[var(--color-muted)] font-medium">
              By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms and Conditions; (4) you are not a minor in the jurisdiction in which you reside.
            </p>
          </section>
        </div>

      </div>
    </main>
  )
}
