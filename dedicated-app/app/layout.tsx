import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#008d8c',
}

export const metadata: Metadata = {
  title: 'Messzen | Mess & Hostel Management',
  description: 'Manage shared meals, expenses, deposits and monthly accounts with Messzen.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
