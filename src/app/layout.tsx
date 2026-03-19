import type { Metadata, Viewport } from 'next'
import { DM_Sans, Baloo_Tamma_2, Noto_Serif_Kannada, Noto_Sans_Kannada, Tiro_Kannada } from 'next/font/google'
import './globals.css'
import InstallPrompt from '@/components/InstallPrompt'
import TopHeader from '@/components/ui/TopHeader'
import MainWrapper from '@/components/MainWrapper'
import { ReaderModeProvider } from '@/context/ReaderModeContext'
import { ReaderSettingsProvider } from '@/context/ReaderSettingsContext'
import { ThemeProvider } from '@/providers/ThemeProvider'
import NavigationWrapper from '@/components/navigation/NavigationWrapper'
import DashboardReturnFab from '@/components/DashboardReturnFab'
import { Toaster } from 'sonner'
import { RippleEffect } from '@/components/RippleEffect'
import { PageTransition } from '@/components/PageTransition'
import NavigationProgressBar from '@/components/NavigationProgressBar'
import OneSignalInitializer from '@/components/OneSignalInitializer'
import { GestureProvider } from '@/components/GestureProvider'

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

const notoSerifKannada = Noto_Serif_Kannada({
  subsets: ['kannada'],
  variable: '--font-noto-serif-kannada',
  display: 'swap',
})

const notoSansKannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  variable: '--font-noto-sans-kannada',
  display: 'swap',
})

const tiroKannada = Tiro_Kannada({
  weight: '400',
  subsets: ['kannada'],
  variable: '--font-tiro-kannada',
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

import { getCachedProfile } from '@/lib/auth/getCachedProfile'

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, profile, permissions } = await getCachedProfile()

  return (
    <html lang="en" className={`${dmSans.variable} ${balooTamma.variable} ${notoSerifKannada.variable} ${notoSansKannada.variable} ${tiroKannada.variable}`} suppressHydrationWarning>
      <body
        className="antialiased transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
          margin: 0,
          padding: 0,
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={['light', 'dark', 'sepia']}>
          <ReaderModeProvider>
            <ReaderSettingsProvider>
              <GestureProvider>
                <NavigationProgressBar />
                <div className="flex min-h-screen">
                  <NavigationWrapper role={profile?.role || null} permissions={permissions} />
                  
                  <div className="flex-1 flex flex-col min-w-0">
                    <TopHeader user={user} role={profile?.role || null} profile={profile} />

                    <PageTransition>
                      <div className="page-enter flex-1 flex flex-col min-h-0 min-w-0">
                        <MainWrapper>{children}</MainWrapper>
                      </div>
                    </PageTransition>
                  </div>
                </div>
                
                <RippleEffect />
                <InstallPrompt />
                <OneSignalInitializer />
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    style: {
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                    },
                    className: 'shadow-[var(--shadow-lg)]',
                    duration: 2500,
                  }}
                  offset={72}
                />

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
              </GestureProvider>
            </ReaderSettingsProvider>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(function(reg) {
                        console.log('SW Registered');
                      }).catch(function(err) {
                        console.log('SW Failed', err);
                      });
                    });
                  }
                `
              }}
            />
          </ReaderModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
