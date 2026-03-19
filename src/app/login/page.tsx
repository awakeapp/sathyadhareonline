'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, ShieldCheck, ArrowLeft, Eye, EyeOff, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginAction } from './actions'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

// Friendly error message map
function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password. Please try again.'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email address first. Check your inbox.'
  if (msg.includes('User not found')) return 'No account found with this email.'
  if (msg.includes('Too many requests')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (msg.includes('network')) return 'Network error. Please check your connection and try again.'
  return msg
}

export default function LoginPage() {
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData()
    fd.append('email', email)
    fd.append('password', password)
    const params = new URLSearchParams(window.location.search)
    fd.append('returnTo', params.get('return_to') || '')

    const res = await loginAction(fd)

    if (res.error) {
      setError(friendlyError(res.error))
      setLoading(false)
      return
    }

    if (res.success && res.destination) {
      window.location.href = res.destination
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const returnTo = params.get('return_to')
    const redirectToUrl = new URL(`${window.location.origin}/auth/callback`)
    if (returnTo) redirectToUrl.searchParams.set('return_to', returnTo)

    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectToUrl.toString() },
    })

    if (magicError) {
      setError(friendlyError(magicError.message))
      setLoading(false)
      return
    }

    setMagicSent(true)
    setLoading(false)
  }

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
      setError(friendlyError(oauthError.message))
      setGoogleLoading(false)
    }
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
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight">Sign In</h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full mb-8 shadow-sm">
          <button
            onClick={() => { setTab('password'); setError(null); setMagicSent(false); }}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-[12px] font-black uppercase tracking-widest transition-all ${tab === 'password' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            <Lock className="w-3.5 h-3.5" /> Password
          </button>
          <button
            onClick={() => { setTab('magic'); setError(null); setMagicSent(false); }}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-[12px] font-black uppercase tracking-widest transition-all ${tab === 'magic' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Email Link
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Password Form */}
        {tab === 'password' && (
          <form onSubmit={handleLogin} className="space-y-4">
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
                <Lock className="w-5 h-5" />
              </div>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
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

            <div className="flex justify-end pr-2">
              <Link href="/forgot-password" className="text-[13px] font-bold text-[var(--color-primary)] hover:underline underline-offset-4">
                Forgotten Password?
              </Link>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-widest"
              >
                {loading
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {/* Magic Link Form */}
        {tab === 'magic' && !magicSent && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-[13px] font-bold text-[var(--color-muted)] text-center px-4 leading-relaxed">
              Enter your email and we&apos;ll send you a secure link to sign in instantly. No password required.
            </p>
            <div className="relative mt-4">
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
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                {loading
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><LinkIcon className="w-5 h-5" /> Send Sign-In Link</>}
              </button>
            </div>
          </form>
        )}

        {/* Magic link success */}
        {tab === 'magic' && magicSent && (
          <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 min-w-[44px] min-h-[44px]" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-[20px] font-black text-[var(--color-text)] tracking-tight">Check Your Inbox</h2>
              <p className="text-[13px] font-bold text-[var(--color-muted)] leading-relaxed px-4">
                We sent a sign-in link to<br />
                <span className="text-[var(--color-text)]">{email}</span>
              </p>
              <p className="text-[11px] font-bold text-[var(--color-muted)] opacity-70">The link expires in 60 minutes.</p>
            </div>
            <button
              onClick={() => { setMagicSent(false); setEmail(''); }}
              className="text-[13px] font-black text-[var(--color-primary)] hover:underline underline-offset-4"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Divider */}
        {!magicSent && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-background)] px-4 text-[var(--color-muted)] font-bold tracking-widest">OR</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors shadow-sm font-bold text-[var(--color-text)] text-[14px] disabled:opacity-50 mb-8"
            >
              {googleLoading
                ? <div className="w-5 h-5 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
                : <><GoogleIcon /> Continue with Google</>}
            </button>
          </>
        )}

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-[14px] font-bold text-[var(--color-muted)]">
            New to Sathyadhare?{' '}
            <Link href="/signup" className="text-[var(--color-primary)] hover:underline underline-offset-4">
              Register
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
