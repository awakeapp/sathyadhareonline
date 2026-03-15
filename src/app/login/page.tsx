'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getRedirectPath } from '@/lib/auth/redirectAfterLogin'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
)

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

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
    <main className="min-h-screen flex flex-col items-center bg-[var(--color-background)] px-6 pt-12">
      
      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header Navigation */}
        <div className="flex items-center mb-12">
          <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight">Sign In</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
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
            <Link href="/forgot-password" title="Forgot Password" className="text-[13px] font-bold text-[var(--color-primary)] hover:underline underline-offset-4">
              Forgotten Password?
            </Link>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-black text-[15px] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-widest"
            >
              {loading
                ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Sign In"}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--color-background)] px-4 text-[var(--color-muted)] font-bold tracking-widest">OR</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center gap-6 mb-12">
            <button className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors shadow-sm">
                <TwitterIcon />
            </button>
            <button className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors shadow-sm">
                <FacebookIcon />
            </button>
            <button 
                onClick={handleGoogleLogin} 
                disabled={googleLoading || loading}
                className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors shadow-sm"
            >
                {googleLoading ? <div className="w-5 h-5 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" /> : <GoogleIcon />}
            </button>
        </div>

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
