'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MoreDrawer } from '@/components/more-drawer'
import { canAccessAppPath, getBottomTabs, getDefaultAppPath, shouldShowDefaultBottomNavigation } from '@/lib/app-permissions'
import { normalizePathname } from '@/lib/auth'
import { appHref } from '@/lib/routes'

export function MobileShell({
  children,
  showBottomNavigation,
  hasFloatingAction = false,
  appearance = 'default',
}: {
  children: ReactNode
  showBottomNavigation?: boolean
  hasFloatingAction?: boolean
  appearance?: 'default' | 'onboarding'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, requestLogout, user } = useAuth()
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false)
  const normalizedPathname = normalizePathname(pathname)
  const bottomNavigationVisible = showBottomNavigation ?? shouldShowDefaultBottomNavigation(user, normalizedPathname)
  const tabs = getBottomTabs(user)
  const canAccess = canAccessAppPath(user, pathname)

  useEffect(() => {
    if (!isLoading && user && !canAccess) {
      router.replace(appHref(getDefaultAppPath(user)))
    }
  }, [canAccess, isLoading, router, user])

  const closeMoreDrawer = useCallback(() => {
    setMoreDrawerOpen(false)
  }, [])

  if (isLoading || !user) {
    return <LoadingIndicator variant="screen" label="Loading application" />
  }

  if (!canAccess) {
    return <div className="grid min-h-screen place-items-center text-body font-semibold text-[#65838b]">Redirecting...</div>
  }

  return (
    <div
      className="phone-frame"
      data-appearance={appearance}
      data-bottom-navigation={bottomNavigationVisible ? 'visible' : 'hidden'}
    >
      <main
        className="app-shell"
        data-bottom-navigation={bottomNavigationVisible ? 'visible' : 'hidden'}
        data-bottom-action={hasFloatingAction ? 'floating' : 'none'}
      >
        {children}
      </main>

      {bottomNavigationVisible ? (
        <nav className="nav-bar" aria-label="Primary">
          <div className="nav-dock">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? normalizedPathname === href : normalizedPathname === href || normalizedPathname.startsWith(`${href}/`)
              if (href === '/more') {
                return (
                  <button
                    key={href}
                    type="button"
                    className="nav-item"
                    data-active={moreDrawerOpen}
                    aria-expanded={moreDrawerOpen}
                    aria-controls={moreDrawerOpen ? 'more-navigation-drawer' : undefined}
                    aria-label={label}
                    title={label}
                    onClick={() => setMoreDrawerOpen(true)}
                  >
                    <span className="nav-icon-shell" aria-hidden="true">
                      <Icon size={18} strokeWidth={2.5} className="nav-icon" />
                    </span>
                    <span>{label}</span>
                  </button>
                )
              }

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
      ) : null}

      <MoreDrawer
        open={moreDrawerOpen}
        user={user}
        onClose={closeMoreDrawer}
        onLogout={requestLogout}
      />
    </div>
  )
}
