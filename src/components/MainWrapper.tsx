'use client'

import { usePathname } from 'next/navigation'
import ReaderModeBar from '@/components/ReaderModeBar'
import ScrollToTop from '@/components/ui/ScrollToTop'

const AUTH_PATHS = ['/login', '/signup']

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage   = AUTH_PATHS.includes(pathname)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor')
  const isArticlePage = pathname.startsWith('/articles/')

  return (
    <main
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out select-none"
      style={{
        paddingTop: isAuthPage || isAdminRoute ? 0 : 'calc(var(--safe-top) + 56px)',
        paddingBottom: isAuthPage || isAdminRoute ? 0 : '90px',
        WebkitTapHighlightColor: 'transparent',
        backgroundColor: 'var(--color-background)',
        minHeight: '100dvh',
        touchAction: 'manipulation'
      }}
    >
      {/* ReaderModeBar reads localStorage directly — no SSR/context/hydration issues */}
      <ReaderModeBar />

      {children}

      {/* Global ScrollToTop for reader pages, hiding on auth, admin, and article pages (since articles have their own scrolling tools) */}
      {!isAuthPage && !isAdminRoute && !isArticlePage && <ScrollToTop />}
    </main>
  )
}
