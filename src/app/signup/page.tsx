'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, ShieldCheck, PenTool, CheckCircle2, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────────────────────────────────
   Inline SVG icons
───────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

/* Password strength checker */
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: score, label: 'Weak', color: '#ef4444' }
  if (score === 2) return { level: score, label: 'Fair', color: '#f59e0b' }
  if (score === 3) return { level: score, label: 'Good', color: '#22c55e' }
  return { level: score, label: 'Strong', color: '#0047ff' }
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
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
  const strength = getPasswordStrength(password)
  const passwordsMatch = password && confirmPassword && password === confirmPassword

  /* ── Signup ── */
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
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

      <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-fade-up">
        
        {/* Left Side: Onboarding Content */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0c1222] to-[#1e144a] text-white relative">
          <div className="relative z-10">
            <Link href="/">
              <img src="/logo-light.png" alt="Sathyadhare" className="h-8 object-contain mb-16" />
            </Link>
            
            <h2 className="text-4xl font-black leading-tight tracking-tight mb-8">
              Start Your Journey<br />
              with <span className="text-[var(--color-primary)]">Sathyadhare</span>.
            </h2>
            
            <div className="space-y-6">
              {[
                { title: "Premium Content", desc: "Access high-quality independent journalism." },
                { title: "Personalized Feed", desc: "Save stories and follow your favorite topics." },
                { title: "Community Access", desc: "Engage with writers and other passionate readers." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{item.title}</h3>
                    <p className="text-white/50 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10">
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">Regional Perspectives · Modern Journalism</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center bg-[var(--color-surface)] overflow-y-auto max-h-[90vh] scrollbar-none">
          <div className="mb-8 block md:hidden text-center">
            <Link href="/">
              <img src={logoSrc} alt="Sathyadhare" className="h-7 object-contain mx-auto" />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight mb-2">Create Account</h1>
            <p className="text-[var(--color-muted)] text-sm">Join the Sathyadhare reader community today.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {message}
            </div>
          )}

          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-[52px] rounded-2xl font-bold text-xs bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all disabled:opacity-50 mb-6"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="uppercase tracking-widest">Sign up with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[var(--color-muted)]">OR EMAIL</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest font-black text-[var(--color-muted)] ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/30 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest font-black text-[var(--color-muted)] ml-1">Email Address</label>
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
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/30 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-black text-[var(--color-muted)] ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full h-12 pl-12 pr-10 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/30 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 outline-none transition-all font-medium text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-black text-[var(--color-muted)] ml-1">Confirm</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className={`w-full h-12 pl-12 pr-10 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/30 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 outline-none transition-all font-medium text-sm ${
                      confirmPassword && !passwordsMatch ? 'border-red-500/50' : ''
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {password && (
              <div className="px-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black uppercase text-[var(--color-muted)] tracking-widest">Strength</span>
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: strength.color }}>{strength.label}</span>
                </div>
                <div className="h-1 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ width: `${(strength.level / 4) * 100}%`, backgroundColor: strength.color }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-14 rounded-2xl bg-[var(--color-accent)] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[var(--color-accent)]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-[var(--color-muted)] font-medium">
            Already a member?{' '}
            <Link href="/login" className="text-[var(--color-accent)] font-black hover:underline underline-offset-4">
              Sign in here
            </Link>
          </p>

          <p className="mt-6 text-[10px] text-center text-[var(--color-muted)]/60 leading-relaxed max-w-[280px] mx-auto">
            By signing up, you agree to our <span className="text-[var(--color-text)] font-bold">Terms</span> and <span className="text-[var(--color-text)] font-bold">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </main>
  )
}
