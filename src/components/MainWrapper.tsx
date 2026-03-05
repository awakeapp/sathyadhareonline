'use client'

import { usePathname } from 'next/navigation'

const AUTH_PATHS = ['/login', '/signup']

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.includes(pathname)

  return (
    <main
      className="overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out"
      style={{
        paddingTop: isAuthPage ? 0 : 'calc(56px + env(safe-area-inset-top, 0px))',
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
