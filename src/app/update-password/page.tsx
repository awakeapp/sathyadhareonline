'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // After successful update, log them out so they can log back in with the new password
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-[var(--color-background)] px-6 pt-12">
      
      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header Navigation */}
        <div className="flex items-center mb-12">
          <Link href="/login" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight">Reset Password</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              <Lock className="w-5 h-5" />
            </div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter New Password"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-[15px] shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-[15px] shadow-sm"
            />
          </div>

          <div className="pt-8">
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
