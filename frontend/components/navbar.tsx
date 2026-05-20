'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-[#eef2f8] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#6f3df4] to-[#2f5bf6] text-sm font-black text-white shadow-md">
            M
          </span>
          <span className="text-xl font-black tracking-tight text-[#0a1433]">Mess.</span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-5 py-3 text-sm font-bold text-[#0a1433] transition hover:bg-[#f3f0ff] hover:text-[#5d36e8]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" onClick={() => router.push('/login')} className="font-bold text-[#0a1433]">
            Login
          </Button>
          <Button onClick={() => router.push('/register')} className="gradient-button h-11 rounded-lg px-6 font-bold">
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
                className="rounded-lg px-4 py-3 text-sm font-bold text-[#0a1433] hover:bg-[#f3f0ff]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => router.push('/login')}>Login</Button>
            <Button className="gradient-button" onClick={() => router.push('/register')}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
