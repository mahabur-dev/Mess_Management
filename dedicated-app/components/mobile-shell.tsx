'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { canAccessAppPath, getBottomTabs, getDefaultAppPath } from '@/lib/app-permissions'
import { normalizePathname } from '@/lib/auth'
import { appHref } from '@/lib/routes'

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, user } = useAuth()
  const normalizedPathname = normalizePathname(pathname)
  const tabs = getBottomTabs(user)
  const canAccess = canAccessAppPath(user, pathname)

  useEffect(() => {
    if (!isLoading && user && !canAccess) {
      router.replace(appHref(getDefaultAppPath(user)))
    }
  }, [canAccess, isLoading, router, user])

  if (isLoading || !user) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-[#65838b]">Loading...</div>
  }

  if (!canAccess) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-[#65838b]">Redirecting...</div>
  }

  return (
    <div className="phone-frame">
      <main className="app-shell">{children}</main>

      <nav className="nav-bar" aria-label="Primary">
        <div className="nav-dock">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? normalizedPathname === href : normalizedPathname === href || normalizedPathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={appHref(href)}
                className="nav-item"
                data-active={active}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                <span className="nav-icon-shell" aria-hidden="true">
                  <Icon size={18} strokeWidth={2.5} className="nav-icon" />
                </span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
