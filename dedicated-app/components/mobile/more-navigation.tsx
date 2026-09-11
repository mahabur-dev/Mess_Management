'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { LoaderCircle, LogOut } from 'lucide-react'
import { getMoreMenuGroups } from '@/lib/app-permissions'
import type { AuthUser } from '@/lib/auth'
import { useTranslations } from '@/lib/i18n'
import { routeLabel } from '@/lib/i18n/navigation'
import { appHref } from '@/lib/routes'
import packageMetadata from '@/package.json'

export function MoreNavigation({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const headingPrefix = useId()
  const navigation = useTranslations('navigation')
  const auth = useTranslations('auth')
  const menuGroups = getMoreMenuGroups(user)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="screen more-page">
      <div className="more-page-groups">
        {menuGroups.map((group) => {
          const headingId = `${headingPrefix}-${group.id}`
          const groupLabel = navigation(group.id === 'account' ? 'account' : group.id === 'workspace' ? 'workspace' : 'helpLegal')

          return (
            <section key={group.id} className="more-page-section" aria-labelledby={headingId}>
              <h2 id={headingId}>{groupLabel}</h2>
              <div className="more-page-list">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={appHref(href)} className="more-page-item">
                    <span className="more-page-item-icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={2.25} />
                    </span>
                    <span className="more-page-item-copy">
                      <strong>{routeLabel(href, label, navigation)}</strong>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="more-page-section more-page-session" aria-labelledby={`${headingPrefix}-session`}>
        <h2 id={`${headingPrefix}-session`}>{navigation('session')}</h2>
        <button
          type="button"
          className="more-page-logout"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
        >
          <span className="more-page-item-icon" aria-hidden="true">
            {isLoggingOut ? <LoaderCircle className="animate-spin" size={20} /> : <LogOut size={20} strokeWidth={2.25} />}
          </span>
          <span className="more-page-item-copy">
            <strong>{isLoggingOut ? auth('signingOut') : navigation('logOut')}</strong>
          </span>
        </button>
      </section>

      <p className="more-page-version">{navigation('version', { version: packageMetadata.version })}</p>
    </div>
  )
}
