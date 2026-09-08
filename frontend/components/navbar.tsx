'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { APP_FEATURES } from '@/lib/feature-flags'
import { useTranslations, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const links: Array<{ labelKey: MessageKey<'navigation'>; href: string }> = [
  { labelKey: 'home', href: '/' },
  { labelKey: 'automation', href: '/#automation' },
  { labelKey: 'mealPattern', href: '/#meal-pattern' },
  { labelKey: 'features', href: '/#features' },
  ...(APP_FEATURES.marketingPricing ? [{ labelKey: 'pricing' as const, href: '/#pricing' }] : []),
  { labelKey: 'aboutUs', href: '/about' },
]

export function Navbar() {
  const pathname = usePathname()
  const navigation = useTranslations('navigation')
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
      <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_600px_minmax(0,1fr)]">
        <Link href="/" aria-label={navigation('messzenHome')} className="justify-self-start">
          <BrandLogo />
        </Link>

        <div className="hidden h-full w-full grid-flow-col auto-cols-fr items-center xl:grid">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'relative flex h-10 items-center justify-center whitespace-nowrap text-[13px] font-semibold leading-none text-muted-foreground transition after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[var(--brand)] after:transition-transform',
                isActive(link.href)
                  ? 'text-foreground after:scale-x-100'
                  : 'hover:text-[var(--brand)] hover:after:scale-x-100',
              )}
            >
              {navigation(link.labelKey)}
            </a>
          ))}
        </div>

        <div className="hidden w-max shrink-0 items-center gap-2 justify-self-end whitespace-nowrap md:flex">
          <a href="/login" className="ghost-button h-10 min-h-0 shrink-0 whitespace-nowrap px-5">
            {navigation('logIn')}
          </a>
          <a href="/register" className="brand-button h-10 min-h-0 shrink-0 whitespace-nowrap px-5">
            {navigation('getStarted')} <ArrowRight size={15} />
          </a>
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 justify-self-end md:hidden">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-foreground"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label={navigation('toggleNavigation')}
          >
            {isOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[var(--marketing-line)] bg-[var(--marketing-page)] px-4 py-4 md:hidden">
          <div className="grid gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-semibold transition',
                  isActive(link.href)
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'text-foreground hover:bg-[var(--marketing-subtle)]',
                )}
              >
                {navigation(link.labelKey)}
              </a>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a href="/login" className="ghost-button" onClick={() => setIsOpen(false)}>{navigation('logIn')}</a>
            <a href="/register" className="brand-button" onClick={() => setIsOpen(false)}>{navigation('getStarted')}</a>
          </div>
        </div>
      )}
    </nav>
  )
}
