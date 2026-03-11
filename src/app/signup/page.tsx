'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── Eye icons ── */
const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  /* ── Signup ── */
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!agreedToTerms) {
      setError('You must agree to the Terms & Agreement')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: 'reader',
      })
    }

    setMessage('Account created! Redirecting to login…')
    setTimeout(() => {
      window.location.href = '/login'
    }, 1800)
  }

  /* ── Google OAuth ── */
  async function handleGoogleSignup() {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[var(--color-background)]">
      
      <div className="w-full max-w-[480px] bg-[var(--color-background)] rounded-[2.5rem] relative z-10 animate-fade-up">

        {/* Top App Bar */}
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-text)]" />
          </Link>
          <Link href="/login" className="text-sm font-bold text-[#f04a4c] hover:underline underline-offset-4">
            Sign In
          </Link>
        </div>

        {/* Main Header */}
        <div className="mb-8 mt-4">
          <h1 className="text-4xl font-extrabold text-[var(--color-text)] tracking-tight mb-2">Create<br />an account</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3 font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition-colors group-focus-within:text-[#f04a4c]">
              <User className="w-5 h-5" />
            </div>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full h-16 pl-14 pr-5 rounded-2xl bg-[var(--color-surface)] border-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]/60 focus:ring-2 focus:ring-[#f04a4c] outline-none transition-all font-semibold text-[15px]"
            />
          </div>

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

          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition-colors group-focus-within:text-[#f04a4c]">
              <Lock className="w-5 h-5" />
            </div>
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-16 pl-14 pr-14 rounded-2xl bg-[var(--color-surface)] border-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]/60 focus:ring-2 focus:ring-[#f04a4c] outline-none transition-all font-semibold text-[15px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {showPassword ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>

          <div className="flex items-center gap-3 px-1 mt-6">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-[var(--color-muted)]/40 text-[#f04a4c] focus:ring-[#f04a4c] cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm font-semibold text-[var(--color-muted)] cursor-pointer">
              I have read <Link href="/terms" className="text-[#f04a4c] hover:underline">Terms & Agreement</Link>
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-16 rounded-full bg-[#f04a4c] text-white font-bold text-[15px] shadow-lg shadow-[#f04a4c]/30 hover:shadow-xl hover:shadow-[#f04a4c]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="mt-12 text-center pb-8">
          <p className="text-sm font-semibold text-[var(--color-muted)] mb-6">Or sign up with</p>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
              className="flex items-center justify-center gap-3 w-36 h-14 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {googleLoading
                ? <div className="w-5 h-5 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
                : <><GoogleIcon /><span className="text-sm font-bold">Google</span></>}
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
