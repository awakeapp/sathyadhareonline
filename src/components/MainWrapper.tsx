'use client'

import { usePathname } from 'next/navigation'
import ReaderModeBar from '@/components/ReaderModeBar'
import ScrollToTop from '@/components/ui/ScrollToTop'

const AUTH_PATHS = ['/login', '/signup']

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage   = AUTH_PATHS.includes(pathname)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor')

  return (
    <main
      className="overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out"
      style={{
        paddingTop: isAuthPage || isAdminRoute ? 0 : 'calc(80px + env(safe-area-inset-top, 0px))',
        paddingBottom: isAuthPage || isAdminRoute ? 0 : '90px',
        WebkitTapHighlightColor: 'transparent',
        backgroundColor: 'var(--color-background)',
        minHeight: '100dvh',
      }}
    >
      {/* ReaderModeBar reads localStorage directly — no SSR/context/hydration issues */}
      <ReaderModeBar />

      {children}

      {/* Global ScrollToTop for reader pages, hiding on auth and admin routes */}
      {!isAuthPage && !isAdminRoute && <ScrollToTop />}
    </main>
  )
}
