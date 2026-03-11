'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react'
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

    // Move to the verification placeholder screen (Screen 10)
    router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[var(--color-background)]">
      
      <div className="w-full max-w-[480px] bg-[var(--color-background)] rounded-[2.5rem] relative z-10 animate-fade-up">

        {/* Top App Bar */}
        <div className="flex items-center py-6">
          <Link href="/login" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-text)]" />
          </Link>
        </div>

        {/* Illustration (Placeholder matching the style) */}
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 bg-[var(--color-surface)] rounded-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#f04a4c]/10 to-transparent" />
            <Mail className="w-16 h-16 text-[#f04a4c]" strokeWidth={1} />
            <div className="absolute bottom-4 right-4 w-6 h-6 bg-[#0a1128] rounded-md flex items-center justify-center rotate-12">
              <div className="w-3 h-3 bg-[#f04a4c] rounded-sm" />
            </div>
            <div className="absolute top-6 left-6 w-8 h-6 bg-[#f04a4c] rounded-md -rotate-12 opacity-80" />
          </div>
        </div>

        {/* Main Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight mb-3">Forget<br />Password</h1>
          <p className="text-[var(--color-muted)] text-[15px] font-medium leading-relaxed max-w-[85%]">
            Enter your email address to reset password
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition-colors group-focus-within:text-[#f04a4c]">
              <Mail className="w-5 h-5" />
            </div>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-16 pl-14 pr-5 rounded-2xl bg-[var(--color-surface)] border-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]/60 focus:ring-2 focus:ring-[#f04a4c] outline-none transition-all font-semibold text-[15px]"
            />
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-full bg-[#f04a4c] text-white font-bold text-[15px] shadow-lg shadow-[#f04a4c]/30 hover:shadow-xl hover:shadow-[#f04a4c]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                : "Next"}
            </button>
          </div>
        </form>

      </div>
    </main>
  )
}
