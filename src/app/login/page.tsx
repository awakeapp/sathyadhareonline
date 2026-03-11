'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, Lock, ShieldCheck, Newspaper, PenTool, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getRedirectPath } from '@/lib/auth/redirectAfterLogin'

/* ── Eye icons ── */
const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
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

/* Role pill badges shown on the left panel */
const ROLE_BADGES = [
  { label: 'Super Admin', color: '#7c3aed', icon: ShieldCheck },
  { label: 'Admin',       color: '#0047ff', icon: Users },
  { label: 'Editor',      color: '#8b5cf6', icon: PenTool },
  { label: 'Reader',      color: '#10b981', icon: Newspaper },
]

export default function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  /* Theme-aware logo */
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'

  /* ── Email / Password Login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Login failed. Please try again.')
      setLoading(false)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const returnTo = params.get('return_to')
    const destination = await getRedirectPath(supabase, data.user.id, returnTo)
    window.location.href = destination
  }

  /* ── Google OAuth ── */
  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const returnTo = params.get('return_to')
    const redirectToUrl = new URL(`${window.location.origin}/auth/callback`)
    if (returnTo) redirectToUrl.searchParams.set('return_to', returnTo)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectToUrl.toString() },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center relative p-4 bg-[var(--color-background)] overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#7c3aed] opacity-[0.04] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-[#0047ff] opacity-[0.04] blur-[130px] rounded-full pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, var(--color-text) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="w-full max-w-[1000px] grid md:grid-cols-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-fade-up">

        {/* ─── Left: Branding ─────────────────────────────────────── */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0f0f1a] to-[#1a1040] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-10 right-10 w-28 h-28 border border-white/[0.06] rounded-full" />
          <div className="absolute bottom-20 left-8 w-48 h-48 border border-white/[0.04] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Link href="/">
              <img src="/logo-light.png" alt="Sathyadhare" className="h-8 object-contain mb-12 hover:scale-105 transition-transform" />
            </Link>

            <h2 className="text-3xl font-black text-white leading-tight tracking-tight mb-4">
              One Login.<br />
              <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">Every Role.</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-10">
              Readers, editors, admins and super admins all sign in from this single page. You&apos;ll be redirected to your own dashboard automatically.
            </p>

            {/* Role badges */}
            <div className="flex flex-col gap-3">
              {ROLE_BADGES.map(({ label, color, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}22`, border: `1px solid ${color}40` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-white/60 text-sm font-semibold">{label}</span>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-white/20 text-[10px] uppercase tracking-[0.25em] font-black">Sathyadhare · Digital Journal</p>
          </div>
        </div>

        {/* ─── Right: Form ─────────────────────────────────────────── */}
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center bg-[var(--color-surface)]">

          {/* Mobile logo */}
          <div className="mb-8 block md:hidden text-center">
            <Link href="/">
              <img src={logoSrc} alt="Sathyadhare" className="h-7 object-contain mx-auto" />
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight mb-2">Welcome Back</h1>
            <p className="text-[var(--color-muted)] text-sm">
              Sign in to your Sathyadhare account — works for all roles.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            id="google-login-btn"
            className="w-full flex items-center justify-center gap-3 h-[52px] rounded-2xl font-bold text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all disabled:opacity-50 mb-6"
          >
            {googleLoading
              ? <div className="w-5 h-5 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
              : <GoogleIcon />}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[10px] uppercase tracking-widest font-black text-[var(--color-muted)]">OR</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Email + Password */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--color-muted)] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/40 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-[var(--color-muted)]">Password</label>
                <button type="button" className="text-[10px] font-bold text-[var(--color-accent)] hover:underline uppercase tracking-wide">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/40 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 outline-none transition-all font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading || googleLoading}
              className="w-full h-14 rounded-2xl bg-[var(--color-accent)] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[var(--color-accent)]/30 hover:shadow-xl hover:shadow-[var(--color-accent)]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-[var(--color-muted)] font-medium">
              New here?{' '}
              <Link href="/signup" className="text-[var(--color-accent)] font-black hover:underline underline-offset-4">
                Create a reader account
              </Link>
            </p>
            <Link href="/" className="block text-[11px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
              Continue without account →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
