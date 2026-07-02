import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import type { CSSProperties } from 'react'
import { AuthProvider } from './context/auth-context'
import { SWRProvider } from './swr-provider'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        url: '/check.png',
      },
    ],
    apple: '/check.png',
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
      style={
        {
          '--font-dashboard-sans':
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          '--font-geist-mono':
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        } as CSSProperties
      }
      className="bg-background"
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <SWRProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SWRProvider>
        {process.env.NODE_ENV === 'development' && <Analytics />}
      </body>
    </html>
  )
}
