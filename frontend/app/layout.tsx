import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import localFont from 'next/font/local'
import '@fontsource-variable/noto-sans-bengali/wght.css'
import Script from 'next/script'
import { AuthProvider } from './context/auth-context'
import { SWRProvider } from './swr-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { LocaleProvider } from '@/lib/i18n'
import './globals.css'

const googleAnalyticsId = 'G-M8F0REF7QX'

const inter = localFont({
  src: '../public/fonts/InterVariable.woff2',
  display: 'swap',
  variable: '--font-dashboard-sans',
  weight: '100 900',
  style: 'normal',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F172A',
}

export const metadata: Metadata = {
  title: 'Messzen.com | Official site | The best mess management software',
  description: 'Manage messes, meals, finances, shopping, and attendance with ease',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/browser-logo.webp',
      },
    ],
    apple: '/browser-logo.webp',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-locale="en"
      className={`${inter.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <LocaleProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SWRProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </SWRProvider>
          </ThemeProvider>
        </LocaleProvider>
        {process.env.NODE_ENV === 'development' && <Analytics />}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}

//check if the user is logged in and redirect to login page if not
