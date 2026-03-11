'use client'

import { usePathname } from 'next/navigation'
import { useReaderMode } from '@/context/ReaderModeContext'
import { useState, useEffect } from 'react'
import ReaderModeBar from '@/components/ReaderModeBar'

const AUTH_PATHS = ['/login', '/signup']

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { readerMode } = useReaderMode()

  const isAuthPage   = AUTH_PATHS.includes(pathname)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor')

  // Hydration guard — readerMode is false on server, may become true after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const safeReaderMode = mounted ? readerMode : false

  const bannerHeight = safeReaderMode && !isAdminRoute
    ? 'calc(32px + env(safe-area-inset-top, 0px))'
    : '0px'

  return (
    <main
      className="overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out"
      style={{
        paddingTop: isAuthPage
          ? 0
          : `calc(56px + ${bannerHeight} + env(safe-area-inset-top, 0px))`,
        paddingBottom: isAuthPage ? 0 : '8rem',
        WebkitTapHighlightColor: 'transparent',
        backgroundColor: 'var(--color-background)',
        minHeight: '100dvh',
      }}
    >
      {/* ReaderModeBar reads localStorage directly — no SSR/context/hydration issues */}
      <ReaderModeBar />

      {children}
    </main>
  )
}
