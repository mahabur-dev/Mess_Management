'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Automation', href: '/#automation' },
  { label: 'Meal Pattern', href: '/#meal-pattern' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About Us', href: '/about' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hash, setHash] = useState('')

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash)
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [pathname])

  const isActive = (href: string) => {
    const [path, linkHash] = href.split('#')
    if (linkHash) return pathname === path && hash === `#${linkHash}`
    return href === '/' ? pathname === '/' && !hash : pathname === href
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--marketing-line)] bg-[var(--marketing-page)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Messzen home">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-6 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative py-2 text-[13px] font-bold text-muted-foreground transition after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[var(--brand)] after:transition-transform',
                isActive(link.href)
                  ? 'text-foreground after:scale-x-100'
                  : 'hover:text-[var(--brand)] hover:after:scale-x-100',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button type="button" onClick={() => router.push('/login')} className="ghost-button h-10 min-h-0 px-5">
            Log in
          </button>
          <button type="button" onClick={() => router.push('/register')} className="brand-button h-10 min-h-0 px-5">
            Get Started <ArrowRight size={15} />
          </button>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-foreground"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[var(--marketing-line)] bg-[var(--marketing-page)] px-4 py-4 shadow-xl md:hidden">
          <div className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-bold transition',
                  isActive(link.href)
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'text-foreground hover:bg-[var(--marketing-subtle)]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="ghost-button" onClick={() => router.push('/login')}>Log in</button>
            <button className="brand-button" onClick={() => router.push('/register')}>Get Started</button>
          </div>
        </div>
      )}
    </nav>
  )
}
