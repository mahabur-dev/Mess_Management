import Link from 'next/link'

export function Footer() {
  return (
    <footer id="contact" className="border-t border-[#e4eaf4] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#005bbb]">
                <span className="font-bold text-white">M</span>
              </div>
              <span className="font-bold text-[#07143d]">MessFlow</span>
            </div>
            <p className="text-sm text-[#667085]">Simplifying mess management</p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[#07143d]">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-[#667085] transition hover:text-[#005bbb]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-[#667085] transition hover:text-[#005bbb]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#667085] transition hover:text-[#005bbb]">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[#07143d]">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#about" className="text-[#667085] transition hover:text-[#005bbb]">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#667085] transition hover:text-[#005bbb]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#667085] transition hover:text-[#005bbb]">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[#07143d]">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-[#667085] transition hover:text-[#005bbb]">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#667085] transition hover:text-[#005bbb]">
                  Support
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-[#667085] transition hover:text-[#005bbb]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e4eaf4] pt-8 sm:flex-row">
          <p className="text-sm text-[#667085]">© 2024 MessFlow. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-[#667085] transition hover:text-[#005bbb]">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-[#667085] transition hover:text-[#005bbb]">
              Terms
            </Link>
            <Link href="#" className="text-sm text-[#667085] transition hover:text-[#005bbb]">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
