'use client'

import { useReaderMode } from '@/context/ReaderModeContext'

interface Props {
  role: string
}

export default function ReaderModeSwitch({ role }: Props) {
  const { enableReaderMode } = useReaderMode()

  const label = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Editor'
  const accentColor = role === 'super_admin' ? '#a78bfa' : '#4f8ef7'
  const bgColor = role === 'super_admin' ? 'rgba(124,58,237,0.12)' : 'rgba(0,71,255,0.12)'
  const borderColor = role === 'super_admin' ? 'rgba(124,58,237,0.3)' : 'rgba(0,71,255,0.3)'

  function handleSwitch() {
    // Store dashboard metadata in localStorage so ReaderModeBar can read it
    // without needing any server props or React context
    try {
      const dashUrl   = role === 'editor' ? '/editor' : '/admin'
      const dashLabel =
        role === 'super_admin' ? 'Super Admin Dashboard' :
        role === 'admin'       ? 'Admin Dashboard' : 'Editor Dashboard'
      const color =
        role === 'super_admin' ? '#7c3aed' :
        role === 'admin'       ? '#0047ff' : '#6d28d9'
      localStorage.setItem('sathyadhare:readerMode',      'true')
      localStorage.setItem('sathyadhare:dashboardUrl',    dashUrl)
      localStorage.setItem('sathyadhare:dashboardLabel',  dashLabel)
      localStorage.setItem('sathyadhare:dashboardColor',  color)
      document.cookie = `sathyadhare:readerMode=true; path=/; max-age=31536000`
    } catch { /* ignore */ }
    window.location.href = '/'
  }

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4 mb-8"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Eye icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px]"
          style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}40` }}
        >
          <svg viewBox="0 0 24 24" fill={accentColor} className="w-5 h-5">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text)] truncate">Reader Mode</p>
          <p className="text-xs text-[var(--color-muted)] truncate">
            Browse the reader site as a visitor
          </p>
        </div>
      </div>

      <button
        id="reader-mode-switch-btn"
        onClick={handleSwitch}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 hover:scale-105 hover:brightness-110"
        style={{ background: accentColor, color: '#fff' }}
        title={`Switch to Reader Mode — return to ${label} dashboard anytime`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
        <span>Switch</span>
      </button>
    </div>
  )
}
