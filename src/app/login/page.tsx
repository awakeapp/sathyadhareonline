'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getRedirectPath } from '@/lib/auth/redirectAfterLogin'

/* ─────────────────────────────────────────────────
   Inline SVG icons (no extra deps)
───────────────────────────────────────────────── */
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Detect theme from document class (set by TopHeader/localStorage)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const logoSrc = theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'

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

    const destination = await getRedirectPath(supabase, data.user.id)
    router.replace(destination)
  }

  /* ── Google OAuth ── */
  async function handleGoogleLogin() {
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
    // On success, Supabase redirects the browser — no further action needed.
  }

  return (
    <main className="min-h-dvh flex items-stretch bg-[var(--color-background)]">

      {/* ══════════════════════════════════════════
          LEFT — Branding Panel (md+)
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b1f] via-[#0d1340] to-[#0a0022]" />

        {/* Decorative glows */}
        <div className="absolute top-[-120px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#ffe500]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[#0047ff]/15 blur-[100px] pointer-events-none" />

        {/* Grid dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-light.png"
            alt="Sathyadhare"
            className="h-9 object-contain mb-10"
          />

          <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Welcome back to<br />
            <span className="text-[#ffe500]">Sathyadhare</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Your trusted source for meaningful journalism, curated stories, and perspectives that matter.
          </p>

          {/* Feature badges */}
          <div className="mt-10 flex flex-col gap-3 w-full">
            {[
              { icon: '📰', label: 'Breaking news & editorials' },
              { icon: '🌏', label: 'Regional & national coverage' },
              { icon: '✍️', label: 'In-depth investigative reports' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/70 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Form Panel
      ══════════════════════════════════════════ */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-8 md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Sathyadhare"
              className="h-8 object-contain mb-5"
              suppressHydrationWarning
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight mb-1.5">
              Sign in
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              id="login-error-banner"
              className="flex items-start gap-3 mb-5 px-4 py-3.5 rounded-2xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
              }}
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Google OAuth button ── */}
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-[52px] rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {googleLoading ? (
              <svg className="animate-spin w-4 h-4 text-[var(--color-muted)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            <span>{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* ── Email / Password form ── */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full h-[52px] px-4 rounded-2xl text-sm text-[var(--color-text)]
                  placeholder:text-[var(--color-muted)]/60
                  bg-[var(--color-surface)]
                  border border-[var(--color-border)]
                  outline-none ring-0
                  transition-all duration-200
                  focus:border-[#0047ff] focus:ring-2 focus:ring-[#0047ff]/20
                "
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-[#0047ff] dark:text-[#ffe500] font-semibold hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full h-[52px] pl-4 pr-12 rounded-2xl text-sm text-[var(--color-text)]
                    placeholder:text-[var(--color-muted)]/60
                    bg-[var(--color-surface)]
                    border border-[var(--color-border)]
                    outline-none ring-0
                    transition-all duration-200
                    focus:border-[#0047ff] focus:ring-2 focus:ring-[#0047ff]/20
                  "
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="
                w-full h-[52px] rounded-2xl font-bold text-sm tracking-wide
                transition-all duration-200 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                mt-1
              "
              style={{
                background: 'linear-gradient(135deg, #0047ff 0%, #0031c8 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,71,255,0.35)',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Signup link */}
          <p className="text-center mt-6 text-sm text-[var(--color-muted)]">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-bold text-[#0047ff] dark:text-[#ffe500] hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>

          {/* Desktop logo (bottom watermark) */}
          <div className="hidden md:flex justify-center mt-10 opacity-30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.png" alt="" className="h-5 object-contain" aria-hidden />
          </div>
        </div>
      </div>
    </main>
  )
}
