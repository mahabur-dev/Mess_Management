import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { LocaleProvider } from '@/lib/i18n'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#008d8c',
}

export const metadata: Metadata = {
  title: 'Messzen | Mess & Hostel Management',
  description: 'Manage shared meals, expenses, deposits and monthly accounts with Messzen.',
  applicationName: 'Messzen',
  manifest: '/manifest-en.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Messzen',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-locale="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LocaleProvider>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  )
}
