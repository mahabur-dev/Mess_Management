import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { Mail, Phone, ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer id="contact" className="border-t border-[#e4eaf4] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BrandLogo />
            </div>
            <p className="text-sm font-semibold text-[#667085]">Simplifying Mess & Hostel Management</p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-[#07143d]">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#features" className="font-semibold text-[#667085] transition hover:text-[#005bbb]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="font-semibold text-[#667085] transition hover:text-[#005bbb]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="font-semibold text-[#667085] transition hover:text-[#005bbb]">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-[#07143d]">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="font-semibold text-[#667085] transition hover:text-[#005bbb]">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="font-semibold text-[#667085] transition hover:text-[#005bbb]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="font-semibold text-[#667085] transition hover:text-[#005bbb]">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-[#07143d]">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:support@messzen.com"
                  className="group flex items-center gap-2.5 font-semibold text-[#667085] transition hover:text-[#005bbb]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f6ff] text-[#005bbb] transition group-hover:bg-[#005bbb] group-hover:text-white">
                    <Mail size={14} />
                  </span>
                  <span className="truncate">support@messzen.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:01797515386"
                  className="group flex items-center gap-2.5 font-semibold text-[#667085] transition hover:text-[#005bbb]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f6ff] text-[#005bbb] transition group-hover:bg-[#005bbb] group-hover:text-white">
                    <Phone size={14} />
                  </span>
                  <span>01797515386</span>
                </a>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/1BanYDh5pu/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f6ff] text-[#005bbb] transition hover:bg-[#005bbb] hover:text-white"
                title="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/mahabur-rahman-9303aa246"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f6ff] text-[#005bbb] transition hover:bg-[#005bbb] hover:text-white"
                title="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e4eaf4] pt-8 sm:flex-row">
          <p className="text-sm font-semibold text-[#667085]">
            &copy; {new Date().getFullYear()} Mess Management. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm font-semibold text-[#667085] transition hover:text-[#005bbb]">
              Privacy
            </Link>
            <Link href="#" className="text-sm font-semibold text-[#667085] transition hover:text-[#005bbb]">
              Terms
            </Link>
            <Link href="#" className="text-sm font-semibold text-[#667085] transition hover:text-[#005bbb]">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
