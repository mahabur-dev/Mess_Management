'use client'

import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '@/app/providers'
import { LoadingIndicator } from '@/components/loading-indicator'
import { canAccessAppPath, getBottomTabs, getDefaultAppPath, getHomeQuickActions, shouldShowDefaultBottomNavigation } from '@/lib/app-permissions'
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
  const nativeScrollRoot = useRef<HTMLDivElement>(null)
  const normalizedPathname = normalizePathname(pathname)
  const bottomNavigationVisible = showBottomNavigation ?? shouldShowDefaultBottomNavigation(user, normalizedPathname)
  const tabs = useMemo(() => getBottomTabs(user), [user])
  const canAccess = canAccessAppPath(user, pathname)

  useEffect(() => {
    if (!isLoading && user && !canAccess) {
      router.replace(appHref(getDefaultAppPath(user)))
    }
  }, [canAccess, isLoading, router, user])

  useEffect(() => {
    if (!user || isLoading) return
    const destinations = new Set([
      '/',
      '/more',
      '/notifications',
      '/quick-add',
      '/meals',
      '/meals/my',
      ...tabs.map((tab) => tab.href),
      ...getHomeQuickActions(user).map((item) => item.href),
    ])
    const prefetch = () => destinations.forEach((href) => router.prefetch(appHref(href)))
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(prefetch, { timeout: 1_200 })
      return () => idleWindow.cancelIdleCallback?.(id)
    }

    const timer = window.setTimeout(prefetch, 250)
    return () => window.clearTimeout(timer)
  }, [isLoading, router, tabs, user])

  useEffect(() => {
    // Android WebView can keep the document viewport fixed when a native
    // status bar overlays it. The app shell owns scrolling on native builds,
    // so every screen remains reachable and each route starts at the top.
    nativeScrollRoot.current?.scrollTo(0, 0)
  }, [pathname])

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
      data-native-scroll-root={Capacitor.isNativePlatform() ? 'true' : 'false'}
      ref={nativeScrollRoot}
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
