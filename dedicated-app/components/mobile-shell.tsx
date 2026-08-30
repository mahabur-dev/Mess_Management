'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { LoadingIndicator } from '@/components/loading-indicator'
import { canAccessAppPath, getBottomTabs, getDefaultAppPath, shouldShowDefaultBottomNavigation } from '@/lib/app-permissions'
import { normalizePathname } from '@/lib/auth'
import { appHref } from '@/lib/routes'
import { useTranslations } from '@/lib/i18n'
import { routeLabel } from '@/lib/i18n/navigation'

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
  const { isLoading, user } = useAuth()
  const common = useTranslations('common')
  const navigation = useTranslations('navigation')
  const normalizedPathname = normalizePathname(pathname)
  const bottomNavigationVisible = showBottomNavigation ?? shouldShowDefaultBottomNavigation(user, normalizedPathname)
  const tabs = getBottomTabs(user)
  const canAccess = canAccessAppPath(user, pathname)

  useEffect(() => {
    if (!isLoading && user && !canAccess) {
      router.replace(appHref(getDefaultAppPath(user)))
    }
  }, [canAccess, isLoading, router, user])

  if (isLoading || !user) {
    return <LoadingIndicator variant="screen" label={common('loadingApplication')} />
  }

  if (!canAccess) {
    return <div className="grid min-h-screen place-items-center text-body font-semibold text-[#65838b]" role="status">{common('redirecting')}</div>
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
        <nav className="nav-bar" aria-label={navigation('primaryNavigation')}>
          <div className="nav-dock">
            {tabs.map(({ href, label, icon: Icon }) => {
              const translatedLabel = routeLabel(href, label, navigation)
              const active = href === '/' ? normalizedPathname === href : normalizedPathname === href || normalizedPathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={appHref(href)}
                  className="nav-item"
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                  aria-label={translatedLabel}
                  title={translatedLabel}
                >
                  <span className="nav-icon-shell" aria-hidden="true">
                    <Icon size={18} strokeWidth={2.5} className="nav-icon" />
                  </span>
                  <span>{translatedLabel}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}

    </div>
  )
}
