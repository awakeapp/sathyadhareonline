'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    // Send password reset email directing user back to update-password page
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    // Move to the verification placeholder screen
    router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-[var(--color-background)] px-6 pt-12">
      
      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header Navigation */}
        <div className="flex items-center mb-12">
          <Link href="/login" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight">Reset Password</h1>
        </div>
        
        <div className="text-center mb-10">
          <p className="text-[var(--color-muted)] text-[14px] font-bold leading-relaxed px-4">
            Enter your email address to receive a password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              <Mail className="w-5 h-5" />
            </div>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-[15px] shadow-sm"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-widest"
            >
              {loading
                ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Submit"}
            </button>
          </div>
        </form>

      </div>
    </main>
  )
}
