import type { Metadata, Viewport } from 'next'
import { DM_Sans, Baloo_Tamma_2 } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import InstallPrompt from '@/components/InstallPrompt'
import TopHeader from '@/components/ui/TopHeader'
import MainWrapper from '@/components/MainWrapper'
import { ReaderModeProvider } from '@/context/ReaderModeContext'
import { ThemeProvider } from '@/providers/ThemeProvider'
import NavigationWrapper from '@/components/navigation/NavigationWrapper'
import DashboardReturnFab from '@/components/DashboardReturnFab'
import { Toaster } from 'sonner'
import { RippleEffect } from '@/components/RippleEffect'
import { PageTransition } from '@/components/PageTransition'

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

  let profile: {
    role: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null = null
  if (user) {
    try {
      const { data: p, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!error && p) profile = { ...p, avatar_url: null } as { role: string | null; full_name: string | null; avatar_url: string | null; }
    } catch (e) {
      console.error('Layout profile fetch error:', e)
    }
  }

  return (
    <html lang="en" className={`${dmSans.variable} ${balooTamma.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
          margin: 0,
          padding: 0,
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReaderModeProvider>
            <div className="flex min-h-screen">
              <NavigationWrapper role={profile?.role || null} />
              
              <div className="flex-1 flex flex-col min-w-0">
                {/* ─────────── FIXED TOP HEADER ─────────── */}
                <TopHeader user={user} role={profile?.role || null} profile={profile} />

                {/* ─────────── PAGE CONTENT ─────────── */}
                <PageTransition>
                  <MainWrapper>{children}</MainWrapper>
                </PageTransition>
              </div>
            </div>
            
            <RippleEffect />
            <InstallPrompt />
            <Toaster position="top-center" theme="system" richColors />

            {/* ── Floating Return-to-Dashboard button (reader mode active) ── */}
            <DashboardReturnFab
              role={profile?.role || null}
              dashboardHref={
                profile?.role === 'super_admin' || profile?.role === 'admin' ? '/admin' :
                profile?.role === 'editor' ? '/editor' : '/'
              }
              dashboardLabel={
                profile?.role === 'super_admin' ? 'Super Admin Dashboard' :
                profile?.role === 'admin'       ? 'Admin Dashboard' :
                profile?.role === 'editor'      ? 'Editor Dashboard' : 'Dashboard'
              }
            />
          </ReaderModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
