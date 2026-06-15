import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Poppins, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// const poppins = Poppins({
//   subsets: ['latin'],
//   weight: ['400', '500', '600', '700', '800', '900'],
//   variable: '--font-dashboard-sans',
// })

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dashboard-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F172A',
}

export const metadata: Metadata = {
  title: 'Mess Management',
  description: 'Manage messes, meals, finances, shopping, and attendance with ease',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/transparent_logo.png',
      },
    ],
    apple: '/transparent_logo.png',
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
    <html lang="en" className={`${plusJakartaSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === 'development' && <Analytics />}
      </body>
    </html>
  )
}
