'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useReaderMode } from '@/context/ReaderModeContext'

interface Props {
  role?: string | null
  dashboardHref: string
  dashboardLabel: string
}

/**
 * A large fixed floating pill that appears whenever a privileged user
 * has reader mode active. Rendered from the root layout so it always
 * exists regardless of what page is being shown.
 */
export default function DashboardReturnFab({ role, dashboardHref }: Props) {
  const router = useRouter()
  const { readerMode, disableReaderMode } = useReaderMode()

  // Guard against SSR mismatch — wait one frame before trusting localStorage
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const isPrivileged = role === 'super_admin' || role === 'admin' || role === 'editor'
  const safeReaderMode = mounted ? readerMode : false

  // Only show when: logged in as privileged user AND reader mode is on
  if (!isPrivileged || !safeReaderMode) return null

  const roleColor =
    role === 'super_admin' ? { bg: '#7c3aed', shadow: '#7c3aed55' } :
    role === 'admin'       ? { bg: '#0047ff', shadow: '#0047ff55' } :
                             { bg: '#6d28d9', shadow: '#6d28d955' }

  function handleReturn() {
    disableReaderMode()
    try {
      document.cookie = 'sathyadhare:readerMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } catch {}
    router.push(dashboardHref)
  }

  return (
    <div
      className="fixed z-[300] left-1/2 -translate-x-1/2 animate-fade-up"
      style={{
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <button
        id="fab-return-dashboard"
        onClick={handleReturn}
        className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 hover:brightness-110"
          style={{
            background: roleColor.bg,
            boxShadow: `0 8px 24px ${roleColor.shadow}, 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        </div>
        <span 
          className="text-[10px] font-black uppercase tracking-widest drop-shadow-sm" 
          style={{ color: roleColor.bg }}
        >
          Dashboard
        </span>
      </button>
    </div>
  )
}
