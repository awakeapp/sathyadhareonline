'use client'

/**
 * ReaderModeBar — Pure client-side return-to-dashboard bar.
 *
 * Reads reader mode state DIRECTLY from localStorage after mount.
 * No server props, no React context, no hydration issues.
 * Guaranteed to show when `sathyadhare:readerMode === 'true'`
 * and the user is on a reader-side route.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const RM_KEY    = 'sathyadhare:readerMode'
const DASH_URL  = 'sathyadhare:dashboardUrl'
const DASH_LABEL = 'sathyadhare:dashboardLabel'
const DASH_COLOR = 'sathyadhare:dashboardColor'

export default function ReaderModeBar() {
  const pathname = usePathname()

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor')
  const isAuthPage   = pathname === '/login' || pathname === '/signup'
  const isReaderSide = !isAdminRoute && !isAuthPage

  const [show, setShow]         = useState(false)
  const [dashUrl, setDashUrl]   = useState('/admin')
  const [dashLabel, setLabel]   = useState('Dashboard')
  const [color, setColor]       = useState('#7c3aed')

  // Read from localStorage once after mount — pure client, no SSR impact
  useEffect(() => {
    if (!isReaderSide) { setShow(false); return }
    try {
      const active = localStorage.getItem(RM_KEY) === 'true'
      const url    = localStorage.getItem(DASH_URL)   || '/admin'
      const label  = localStorage.getItem(DASH_LABEL) || 'Dashboard'
      const col    = localStorage.getItem(DASH_COLOR)  || '#7c3aed'
      setShow(active)
      setDashUrl(url)
      setLabel(label)
      setColor(col)
    } catch { /* ignore */ }
  }, [isReaderSide, pathname])

  if (!show) return null

  function handleReturn() {
    try {
      localStorage.removeItem(RM_KEY)
      document.cookie = `${RM_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch { /* ignore */ }
    window.location.href = dashUrl
  }

  return (
    <div
      id="reader-mode-bar"
      className="mx-4 mb-4 rounded-2xl flex items-center justify-between gap-3 px-4 py-3"
      style={{ background: `${color}18`, border: `1px solid ${color}40` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}40` }}
        >
          <svg viewBox="0 0 24 24" fill={color} className="w-4 h-4">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-[var(--color-muted)] truncate">
          Reader Mode — browsing as a reader
        </p>
      </div>

      <button
        id="reader-mode-bar-return-btn"
        onClick={handleReturn}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-white transition-all active:scale-95 hover:brightness-110 whitespace-nowrap"
        style={{ background: color }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to {dashLabel}</span>
      </button>
    </div>
  )
}
