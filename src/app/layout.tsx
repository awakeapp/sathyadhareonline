import type { Metadata, Viewport } from 'next'
import { DM_Sans, Baloo_Tamma_2 } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import InstallPrompt from '@/components/InstallPrompt'
import BottomNavigation from '@/components/ui/BottomNavigation'
import TopHeader from '@/components/ui/TopHeader'
import MainWrapper from '@/components/MainWrapper'
import { ReaderModeProvider } from '@/context/ReaderModeContext'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const balooTamma = Baloo_Tamma_2({
  subsets: ['kannada'],
  variable: '--font-baloo-tamma',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#181623',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Sathyadhare',
  description: 'Sathyadhare Digital Journal — Stories that matter.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sathyadhare',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role || null
  }



  return (
    <html lang="en" className={`dark ${dmSans.variable} ${balooTamma.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        style={{ 
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
          margin: 0,
          padding: 0,
        }}
      >
        <ReaderModeProvider>
          {/* ─────────── FIXED TOP HEADER ─────────── */}
          <TopHeader user={user} role={role} />

          {/* ─────────── PAGE CONTENT ─────────── */}
          <MainWrapper>{children}</MainWrapper>

          {/* ─────────── FIXED BOTTOM NAV ─────────── */}
          <BottomNavigation user={user} role={role} />
          
          <InstallPrompt />
        </ReaderModeProvider>
      </body>
    </html>
  )
}
