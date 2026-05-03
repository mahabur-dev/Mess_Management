'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">Mess</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition">
              About
            </Link>
            <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition">
              Contact
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-foreground hover:bg-accent/10"
            >
              Login
            </Button>
            <Button
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent/10 transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-4 pt-4">
              <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition">
                About
              </Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition">
                Contact
              </Link>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push('/login')
                    setIsOpen(false)
                  }}
                  className="flex-1 text-foreground"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    router.push('/register')
                    setIsOpen(false)
                  }}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
