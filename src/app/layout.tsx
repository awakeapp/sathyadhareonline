import type { Metadata, Viewport } from 'next'
import { DM_Sans, Baloo_Tamma_2 } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import InstallPrompt from '@/components/InstallPrompt'
import BottomNavigation from '@/components/ui/BottomNavigation'
import TopHeader from '@/components/ui/TopHeader'

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

  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name')

  return (
    <html lang="en" className={`dark ${dmSans.variable} ${balooTamma.variable}`} suppressHydrationWarning>
      <body
        className="text-white font-sans antialiased"
        style={{ 
          backgroundColor: '#181623',
          minHeight: '100dvh', // Modern dvh for mobile
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#181623' }}>
          {/* ─────────── STICKY TOP HEADER ─────────── */}
          <TopHeader user={user} role={role} categories={categories ?? []} />

          {/* ─────────── PAGE CONTENT (Elastic Page Transitions) ─────────── */}
          <main className="flex-1 overflow-x-hidden pb-32 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out" 
                style={{ WebkitTapHighlightColor: 'transparent' }}>
            {children}
          </main>

          {/* ─────────── FIXED BOTTOM NAV ─────────── */}
          <BottomNavigation user={user} role={role} />
          
          <InstallPrompt />
        </div>
        
      </body>
    </html>
  )
}
