import Link from 'next/link'
import { ArrowRight, Facebook, Linkedin, Mail, Phone } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Automation', href: '/#automation' },
      { label: 'Meal Pattern', href: '/#meal-pattern' },
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Log in', href: '/login' },
      { label: 'Create account', href: '/register' },
    ],
  },
]

export function Footer() {
  return (
    <footer id="contact" className="border-t border-[var(--marketing-line)] bg-[var(--marketing-page)]">
      <div className="marketing-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_.7fr_.7fr_1.1fr]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-muted-foreground">
              One calm workspace for meals, expenses, bills, members, and everyday mess operations.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=61593445971176"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="ghost-button size-10 min-h-0 p-0"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://www.linkedin.com/in/mahabur-rahman-9303aa246"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="ghost-button size-10 min-h-0 p-0"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm font-medium text-muted-foreground transition hover:text-[var(--brand)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-foreground">Let’s stay connected</h3>
            <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
              Questions about your mess setup? Our team is ready to help.
            </p>
            <div className="mt-4 space-y-3">
              <a href="mailto:support@messzen.com" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand)]">
                <Mail size={15} /> support@messzen.com
              </a>
              <a href="tel:01797515386" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[var(--brand)]">
                <Phone size={15} /> 01797515386
              </a>
            </div>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]">
              Contact our team <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--marketing-line)] pt-7 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Messzen. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="transition hover:text-[var(--brand)]">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="transition hover:text-[var(--brand)]">Terms &amp; Conditions</Link>
            <Link href="/privacy-policy#storage-and-cookies" className="transition hover:text-[var(--brand)]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
