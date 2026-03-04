import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function signup(formData: FormData) {
  'use server'

  const fullName = formData.get('full_name') as string
  const email    = formData.get('email')     as string
  const password = formData.get('password')  as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    await supabase.from('profiles').upsert({
      id:        data.user.id,
      full_name: fullName,
      role:      'reader',
    })
  }

  redirect('/login?message=Account created. Please log in.')
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>Create Account</h1>

      {error && (
        <p style={{ color: 'red' }}>{decodeURIComponent(error)}</p>
      )}

      {message && (
        <p style={{ color: 'green' }}>{decodeURIComponent(message)}</p>
      )}

      <form action={signup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Full Name
          <input
            name="full_name"
            type="text"
            required
            autoComplete="name"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </main>
  )
}
