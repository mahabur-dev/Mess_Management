'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, MenuSquare, UtensilsCrossed, Users } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Home', icon: House },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/more', label: 'More', icon: MenuSquare },
]

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="phone-frame">
      <main className="app-shell">{children}</main>

      <nav className="nav-bar glass">
        <div className="flex bg-white">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className="nav-item" data-active={active}>
                <Icon size={18} className="mx-auto mb-1" />
                <div className="text-[10px] font-bold leading-none">{label}</div>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
