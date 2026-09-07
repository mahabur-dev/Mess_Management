'use client'

import Link from 'next/link'
import { ArrowRight, Facebook, Linkedin, Mail, Phone } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { APP_FEATURES } from '@/lib/feature-flags'
import { useLocaleFormatters, useTranslations, type MessageKey } from '@/lib/i18n'

type FooterLink =
  | { namespace: 'navigation'; labelKey: MessageKey<'navigation'>; href: string }
  | { namespace: 'footer'; labelKey: MessageKey<'footer'>; href: string }

const footerGroups: Array<{
  titleKey: MessageKey<'footer'>
  links: FooterLink[]
}> = [
  {
    titleKey: 'product',
    links: [
      { namespace: 'navigation', labelKey: 'automation', href: '/#automation' },
      { namespace: 'navigation', labelKey: 'mealPattern', href: '/#meal-pattern' },
      { namespace: 'navigation', labelKey: 'features', href: '/#features' },
      ...(APP_FEATURES.marketingPricing
        ? [{ namespace: 'navigation' as const, labelKey: 'pricing' as const, href: '/#pricing' }]
        : []),
    ],
  },
  {
    titleKey: 'company',
    links: [
      { namespace: 'navigation', labelKey: 'aboutUs', href: '/about' },
      { namespace: 'footer', labelKey: 'contact', href: '/contact' },
      { namespace: 'navigation', labelKey: 'logIn', href: '/login' },
      { namespace: 'footer', labelKey: 'createAccount', href: '/register' },
    ],
  },
]

export function Footer() {
  const footer = useTranslations('footer')
  const navigation = useTranslations('navigation')
  const format = useLocaleFormatters()
  const year = format.number(new Date().getFullYear(), { useGrouping: false })

  return (
    <footer id="contact" className="border-t border-[var(--marketing-line)] bg-[var(--marketing-page)]">
      <div className="marketing-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_.7fr_.7fr_1.1fr]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-muted-foreground">
              {footer('description')}
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=61593445971176"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="ghost-button size-10 min-h-0 p-0"
              >
                <Facebook size={16} aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/mahabur-rahman-9303aa246"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="ghost-button size-10 min-h-0 p-0"
              >
                <Linkedin size={16} aria-hidden="true" />
              </a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.titleKey}>
              <h3 className="text-sm font-semibold text-foreground">{footer(group.titleKey)}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--brand)]"
                    >
                      {link.namespace === 'navigation'
                        ? navigation(link.labelKey)
                        : footer(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-foreground">{footer('connectTitle')}</h3>
            <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
              {footer('connectDescription')}
            </p>
            <div className="mt-4 space-y-3">
              <a href="mailto:support@messzen.com" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand)]">
                <Mail size={15} aria-hidden="true" /> support@messzen.com
              </a>
              <a href="tel:01797515386" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand)]">
                <Phone size={15} aria-hidden="true" /> 01797515386
              </a>
            </div>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]">
              {footer('contactTeam')} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--marketing-line)] pt-7 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Messzen. {footer('rights')}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="transition-colors hover:text-[var(--brand)]">{footer('privacy')}</Link>
            <Link href="/terms-and-conditions" className="transition-colors hover:text-[var(--brand)]">{footer('terms')}</Link>
            <Link href="/privacy-policy#storage-and-cookies" className="transition-colors hover:text-[var(--brand)]">{footer('cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
