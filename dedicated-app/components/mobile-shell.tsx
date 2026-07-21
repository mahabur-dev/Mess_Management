'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, MenuSquare, UtensilsCrossed, Users } from 'lucide-react'
import { useAuth } from '@/app/providers'

const tabs = [
  { href: '/', label: 'Dashboard', icon: House, center: true },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/more', label: 'More', icon: MenuSquare },
]

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isLoading, user } = useAuth()

  if (isLoading || !user) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-[#65838b]">Loading...</div>
  }

  return (
    <div className="phone-frame">
      <main className="app-shell">{children}</main>

      <nav className="nav-bar" aria-label="Primary">
        <div className="nav-dock">
          {tabs.map(({ href, label, icon: Icon, center }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="nav-item"
                data-active={active}
                data-center={center || undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                <span className="nav-icon-shell" aria-hidden="true">
                  <Icon size={18} strokeWidth={2.5} className="nav-icon" />
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
