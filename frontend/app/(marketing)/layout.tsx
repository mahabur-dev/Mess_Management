import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const inter = localFont({
  src: '../../public/fonts/InterVariable.woff2',
  display: 'swap',
  variable: '--font-marketing-sans',
  weight: '100 900',
  style: 'normal',
})

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.variable} marketing-shell`}>
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
