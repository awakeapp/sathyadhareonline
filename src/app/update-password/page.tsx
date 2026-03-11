'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Lock, ArrowRight, Smartphone } from 'lucide-react'
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

    // After successful update, log them out so they can log back in with the new password,
    // or just redirect them to their dashboard since they are already authenticated by the link.
    // We'll send them to login since that's standard.
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[var(--color-background)]">
      
      <div className="w-full max-w-[480px] bg-[var(--color-background)] rounded-[2.5rem] relative z-10 animate-fade-up">

        {/* Top App Bar */}
        <div className="flex items-center py-6">
          <Link href="/login" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-text)]" />
          </Link>
        </div>

        {/* Illustration (Placeholder matching the device/padlock lock style) */}
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 bg-[var(--color-surface)] rounded-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#f04a4c]/10 to-transparent" />
            <div className="relative z-10 bg-white dark:bg-[#1a1c35] p-3 rounded-xl border-4 border-[#f04a4c] shadow-lg rotate-12">
              <Lock className="w-10 h-10 text-[#f04a4c]" strokeWidth={2.5} />
            </div>
            {/* Phone element behind it */}
            <div className="absolute left-[30%] top-6 -rotate-12">
               <Smartphone className="w-20 h-28 text-[var(--color-muted)] opacity-20" strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight mb-3">Update<br />Password</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition-colors group-focus-within:text-[#f04a4c]">
              <Lock className="w-5 h-5" />
            </div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              className="w-full h-16 pl-14 pr-5 rounded-2xl bg-[var(--color-surface)] border-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]/60 focus:ring-2 focus:ring-[#f04a4c] outline-none transition-all font-semibold text-[15px]"
            />
          </div>

          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition-colors group-focus-within:text-[#f04a4c]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat Password"
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
                : "Submit"}
            </button>
          </div>
        </form>

      </div>
    </main>
  )
}
