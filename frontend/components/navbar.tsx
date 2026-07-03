'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Dashboard', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Why Choose', href: '/#about' },
  { label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hash, setHash] = useState('')

  useEffect(() => {
    const syncHash = () => {
      setHash(window.location.hash)
    }

    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [pathname])

  const isActiveLink = (href: string) => {
    const [linkPath, linkHash] = href.split('#')

    if (linkHash) {
      return pathname === linkPath && hash === `#${linkHash}`
    }

    if (href === '/') {
      return pathname === '/' && !hash
    }

    return pathname === href
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e4eaf4] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 ">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-xl px-5 py-3 text-sm font-bold transition',
                isActiveLink(link.href)
                  ? 'bg-[#eef5ff] text-[#005bbb] shadow-[inset_0_0_0_1px_rgba(47,128,237,0.14)]'
                  : 'text-[#2A2A2E] hover:bg-[#e7f1ff] hover:text-[#005bbb]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button onClick={() => router.push('/login')} className="h-10 rounded-lg bg-[#005bbb] px-6 font-bold text-white hover:bg-[#004fa3]">
            Login
          </Button>
          <Button onClick={() => router.push('/register')} className="h-10 rounded-lg bg-[#005bbb] px-6 font-bold text-white hover:bg-[#004fa3]">
            Get Started
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-bold transition',
                  isActiveLink(link.href)
                    ? 'bg-[#eef5ff] text-[#005bbb]'
                    : 'text-[#07143d] hover:bg-[#e7f1ff]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => router.push('/login')}>Login</Button>
            <Button className="bg-[#005bbb] text-white hover:bg-[#004fa3]" onClick={() => router.push('/register')}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
