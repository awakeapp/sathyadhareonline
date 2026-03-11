'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, ArrowLeft, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <div className="w-full max-w-[480px] bg-[var(--color-background)] rounded-[2.5rem] relative z-10 animate-fade-up">

      {/* Top App Bar */}
      <div className="flex items-center py-6">
        <Link href="/forgot-password" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface)] transition-colors">
          <ArrowLeft className="w-6 h-6 text-[var(--color-text)]" />
        </Link>
      </div>

      {/* Main Header */}
      <div className="mb-12 mt-4">
        <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight mb-3">Verification</h1>
        <p className="text-[var(--color-muted)] text-[15px] font-medium leading-relaxed max-w-[85%]">
          Check your email for the verification link we sent you to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 font-semibold">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3 font-semibold">
          <MailCheck className="w-5 h-5 shrink-0" />
          {message}
        </div>
      )}

      {/* Visual OTP representation (Non-interactive since Supabase uses Magic Links for Password Reset by default) */}
      <div className="flex justify-start gap-4 mb-16 opacity-50 pointer-events-none">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-14 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center">
            {i === 2 && <div className="w-2 h-2 rounded-full bg-[#f04a4c]" />}
          </div>
        ))}
      </div>

      <div className="pt-2 text-center">
        <p className="text-sm font-semibold text-[var(--color-muted)] mb-8">
          Haven't received the link?{' '}
          <button 
            type="button" 
            onClick={handleResendCode}
            className="text-[#f04a4c] font-black hover:underline"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Link'}
          </button>
        </p>

        <button
          type="button"
          onClick={() => window.open('https://mail.google.com', '_blank')}
          className="w-full h-16 rounded-full bg-[#f04a4c] text-white font-bold text-[15px] shadow-lg shadow-[#f04a4c]/30 hover:shadow-xl hover:shadow-[#f04a4c]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Open Mail App
        </button>
      </div>
    </div>
  )
}

export default function VerificationPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[var(--color-background)]">
      <Suspense fallback={<div className="w-full max-w-[480px] h-full" />}>
        <VerifyContent />
      </Suspense>
    </main>
  )
}
