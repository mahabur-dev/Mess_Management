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
  title: 'Dedicated App | Mess Management',
  description: 'Mess management app',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
