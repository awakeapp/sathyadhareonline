'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Lock, ShieldCheck, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

// Friendly error messages
function friendlyError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('User already registered')) return 'An account with this email already exists. Try signing in instead.'
  if (msg.includes('Password should be')) return 'Password must be at least 6 characters long.'
  if (msg.includes('Too many requests')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (msg.includes('network')) return 'Network error. Please check your connection and try again.'
  return msg
}

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' }
  return { score: 4, label: 'Strong', color: '#22c55e' }
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Auto-check terms if accepted from Terms & Conditions page
  useEffect(() => {
    // Check both localStorage and URL params for maximum reliability
    const isAcceptedInStorage = localStorage.getItem('terms-accepted') === 'true';
    const isAcceptedInUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('accepted') === 'true';

    if (isAcceptedInStorage || isAcceptedInUrl) {
      // Defer to next tick to avoid cascading render lint error
      setTimeout(() => setAgreedToTerms(true), 0);
      localStorage.removeItem('terms-accepted');
    }
  }, []);

  const strength = useMemo(() => getPasswordStrength(password), [password])

  async function handleToggleTerms() {
    import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
    setAgreedToTerms(!agreedToTerms);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError('You must agree to the User Agreement & Privacy Policy')
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
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(friendlyError(signUpError.message))
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

    setSignedUp(true)
    setLoading(false)
  }

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
      setError(friendlyError(oauthError.message))
      setGoogleLoading(false)
    }
  }

  // ── Success Screen ──
  if (signedUp) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] px-6">
        <div className="w-full max-w-[420px] flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95">
          <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight">Account Created!</h1>
            <p className="text-[14px] font-bold text-[var(--color-muted)] leading-relaxed px-4">
              We sent a confirmation link to<br />
              <span className="text-[var(--color-text)]">{email}</span>
            </p>
            <p className="text-[12px] font-bold text-[var(--color-muted)]/70 leading-relaxed px-4">
              Please check your inbox and click the link to verify your account before signing in.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest"
          >
            Go to Sign In
          </Link>
          <p className="text-[12px] font-bold text-[var(--color-muted)]">
            Didn&apos;t get the email? Check your spam folder.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-[var(--color-background)] px-6 pt-12">
      
      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header Navigation */}
        <div className="flex items-center mb-12">
          <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight">Create Account</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          
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
              autoComplete="email"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-[15px] shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              <User className="w-5 h-5" />
            </div>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              autoComplete="name"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-[15px] shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                <Lock className="w-5 h-5" />
              </div>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                className="w-full h-14 pl-14 pr-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-[15px] shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="px-2 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: i <= strength.score ? strength.color : 'var(--color-border)',
                      }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: strength.color }}>
                    {strength.label}
                    {strength.score === 1 && ' — use at least 8 characters with numbers'}
                    {strength.score === 2 && ' — add uppercase letters or symbols'}
                    {strength.score === 3 && ' — add symbols to make it stronger'}
                    {strength.score === 4 && ' — excellent password!'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-4 px-3 mt-8">
            <button
              type="button"
              id="terms-toggle"
              onClick={handleToggleTerms}
              className="mt-0.5 shrink-0 transition-transform active:scale-90"
            >
              {agreedToTerms ? (
                <div className="animate-in zoom-in-50 duration-300">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20">
                    <CheckCircle2 className="w-5 h-5" strokeWidth={3} />
                  </div>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 transition-all" />
              )}
            </button>
            <label htmlFor="terms-toggle" className="text-[13px] font-bold text-[var(--color-muted)] leading-snug cursor-pointer select-none">
              I have read and agree to the{' '}
              <Link href="/terms" className="text-[var(--color-primary)] hover:underline underline-offset-4">
                User Agreement & Privacy Policy
              </Link>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-widest"
            >
              {loading
                ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--color-background)] px-4 text-[var(--color-muted)] font-bold tracking-widest">OR</span>
          </div>
        </div>

        {/* Google Signup - Full Width */}
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          className="w-full h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors shadow-sm font-bold text-[var(--color-text)] text-[14px] disabled:opacity-50 mb-8"
        >
          {googleLoading
            ? <div className="w-5 h-5 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
            : <><GoogleIcon /> Continue with Google</>}
        </button>

        {/* Footer Link */}
        <div className="text-center pb-12">
          <p className="text-[14px] font-bold text-[var(--color-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-primary)] hover:underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
