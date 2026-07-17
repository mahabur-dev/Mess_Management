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
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About Us', href: '/about' },
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
    <nav className="sticky top-0 z-50 border-b border-[#edf3f2] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 ">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative py-2 text-sm font-bold text-[#101828] transition after:absolute after:inset-x-0 after:-bottom-1 after:mx-auto after:h-0.5 after:w-0 after:rounded-full after:bg-[#008b80] after:transition-all',
                isActiveLink(link.href)
                  ? 'text-[#008b80] after:w-full'
                  : 'hover:text-[#008b80]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="outline"
            onClick={() => router.push('/login')}
            className="h-10 rounded-md border-[#c9e4e1] bg-white px-6 font-bold text-[#006b63] hover:border-[#008b80] hover:bg-[#e7f7f5] hover:text-[#00574f]"
          >
            Login
          </Button>
          <Button onClick={() => router.push('/register')} className="h-10 rounded-md bg-[#008b80] px-6 font-bold text-white shadow-[0_10px_22px_rgba(0,139,128,0.18)] hover:bg-[#006b63]">
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
                    ? 'bg-[#e7f7f5] text-[#008b80]'
                    : 'text-[#071821] hover:bg-[#eef8f7]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-[#c9e4e1] bg-white text-[#006b63] hover:bg-[#e7f7f5]"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
            <Button className="bg-[#008b80] text-white hover:bg-[#006b63]" onClick={() => router.push('/register')}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
