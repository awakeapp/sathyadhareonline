'use client'

import { usePathname } from 'next/navigation'
import { useReaderMode } from '@/context/ReaderModeContext'

const AUTH_PATHS = ['/login', '/signup']

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { readerMode } = useReaderMode()

  const isAuthPage  = AUTH_PATHS.includes(pathname)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor')

  // When a privileged user is in reader mode (on reader side), the banner
  // pushes the header down by ~32px, so we need extra top padding.
  const bannerHeight = readerMode && !isAdminRoute ? 'calc(32px + env(safe-area-inset-top, 0px))' : '0px'

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
      {children}
    </main>
  )
}
