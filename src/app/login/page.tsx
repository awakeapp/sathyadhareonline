'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, Globe, PenTool, ArrowRight, Mail, Lock, ShieldCheck } from 'lucide-react'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Detect theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
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
      options: {
        redirectTo: redirectToUrl.toString(),
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center relative p-4 bg-[var(--color-background)] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[var(--color-accent)] opacity-[0.03] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-[var(--color-primary)] opacity-[0.03] blur-[130px] rounded-full" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-text) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-[1000px] grid md:grid-cols-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-fade-up">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-24 h-24 border border-white/10 rounded-full" />
            <div className="absolute bottom-20 left-10 w-40 h-40 border border-white/5 rounded-full" />
          </div>

          <div className="relative z-10">
            <Link href="/">
              <img src="/logo-light.png" alt="Sathyadhare" className="h-8 object-contain mb-12 hover:scale-105 transition-transform" />
            </Link>
            
            <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-6">
              Empowering<br />
              <span className="text-[var(--color-primary)]">Modern Voices</span><br />
              in Journalism.
            </h2>
            
            <p className="text-white/50 text-base leading-relaxed max-w-xs">
              Join our community of readers and creators dedicated to deep storytelling and regional perspectives.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            {[
              { icon: <Newspaper className="w-5 h-5" />, text: "Daily Digital News" },
              { icon: <ShieldCheck className="w-5 h-5" />, text: "Verified Perspectives" },
              { icon: <PenTool className="w-5 h-5" />, text: "Creative Editorials" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/70 text-sm font-medium">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  {item.icon}
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[var(--color-surface)]">
          <div className="mb-10 block md:hidden">
            <Link href="/">
              <img src={logoSrc} alt="Sathyadhare" className="h-7 object-contain mx-auto" />
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight mb-2">Welcome Back</h1>
            <p className="text-[var(--color-muted)] text-sm">Securely sign in to your Sathyadhare account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 animate-shake">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-[56px] rounded-2xl font-bold text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all disabled:opacity-50 mb-6"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[10px] uppercase tracking-widest font-black text-[var(--color-muted)]">OR</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

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
                <Link href="#" className="text-[10px] font-bold text-[var(--color-accent)] hover:underline uppercase tracking-wide">Forgot?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
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
              disabled={loading || googleLoading}
              className="w-full h-14 rounded-2xl bg-[var(--color-accent)] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[var(--color-accent)]/30 hover:shadow-xl hover:shadow-[var(--color-accent)]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Connect <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-muted)] font-medium">
            New here?{' '}
            <Link href="/signup" className="text-[var(--color-accent)] font-black hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
