import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user!.id)
    .single()

  const role = profile?.role ?? 'editor'
  const name = profile?.full_name ?? 'Editor'

  const dashboardHref = role === 'super_admin' || role === 'admin' ? '/admin' : '/editor'

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        padding: '40px 24px 120px',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(0,71,255,0.15)',
            color: '#4f8ef7',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: 40,
            marginBottom: 12,
          }}
        >
          Editor Dashboard
        </span>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.5px',
            color: 'var(--color-text)',
          }}
        >
          Welcome, {name}
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: 6, fontSize: 14 }}>
          Manage articles and content as an editor.
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          {
            label: 'Write New Article',
            href: '/admin/articles/new',
            desc: 'Create and publish a new article',
            color: '#0047ff',
          },
          {
            label: 'My Articles',
            href: '/admin/articles',
            desc: 'View and edit your existing articles',
            color: '#7c3aed',
          },
          {
            label: 'Browse Reader Mode',
            href: '/app',
            desc: 'See the site as a reader',
            color: '#059669',
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '18px 20px',
              textDecoration: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: item.color,
                  marginBottom: 3,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.desc}</div>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{ width: 18, height: 18, color: 'var(--color-muted)', flexShrink: 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Footer links */}
      <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
        <Link
          href={dashboardHref}
          style={{
            fontSize: 13,
            color: '#ffe500',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Dashboard
        </Link>
        <Link
          href="/logout"
          style={{
            fontSize: 13,
            color: '#f87171',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Logout
        </Link>
      </div>
    </div>
  )
}
