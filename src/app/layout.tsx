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
import { Toaster } from 'sonner'

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
      const { data: p } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', user.id)
        .single()
      profile = p || null
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
                <MainWrapper>{children}</MainWrapper>
              </div>
            </div>
            
            <InstallPrompt />
            <Toaster position="top-center" theme="system" richColors />
          </ReaderModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
