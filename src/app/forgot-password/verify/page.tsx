'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, ArrowLeft, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleResendCode() {
    setError(null)
    setMessage(null)

    if (!email) {
      setError("No email found to resend to.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage("A new link has been sent to your email.")
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-[420px] flex flex-col">

      {/* Header Navigation */}
      <div className="flex items-center mb-12">
        <Link href="/forgot-password" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
      </div>

      {/* Main Header */}
      <div className="text-center mb-10">
        <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight mb-4">Verification</h1>
        <p className="text-[var(--color-muted)] text-[14px] font-bold leading-relaxed px-4">
          Check your email for the verification link we sent to <span className="text-[var(--color-text)]">{email}</span>.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
          <MailCheck className="w-5 h-5 shrink-0" />
          {message}
        </div>
      )}

      <div className="pt-6 text-center">
        <button
          type="button"
          onClick={() => window.open('https://mail.google.com', '_blank')}
          className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest mb-10"
        >
          Open Mail App
        </button>

        <p className="text-[14px] font-bold text-[var(--color-muted)]">
          Haven&apos;t received the link?{' '}
          <button 
            type="button" 
            onClick={handleResendCode}
            className="text-[var(--color-primary)] font-black hover:underline underline-offset-4"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Link'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default function VerificationPage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-[var(--color-background)] px-6 pt-12">
      <Suspense fallback={<div className="w-full max-w-[420px] h-full" />}>
        <VerifyContent />
      </Suspense>
    </main>
  )
}
