'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, LoaderCircle, LogOut, UserRound } from 'lucide-react'
import { getMoreMenuGroups } from '@/lib/app-permissions'
import type { AuthUser } from '@/lib/auth'
import { useTranslations } from '@/lib/i18n'
import { routeDescription, routeLabel } from '@/lib/i18n/navigation'
import { appHref } from '@/lib/routes'
import packageMetadata from '@/package.json'

function userInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function MoreNavigation({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const headingPrefix = useId()
  const navigation = useTranslations('navigation')
  const auth = useTranslations('auth')
  const menuGroups = getMoreMenuGroups(user)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const avatarUrl = user.avatar_url?.trim() ?? ''
  const name = user.name.trim()
  const initials = userInitials(name)

  useEffect(() => {
    setAvatarFailed(false)
  }, [avatarUrl])

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
      <Link
        href={appHref('/profile')}
        className="more-page-account"
        aria-label={name ? navigation('openProfile', { name }) : navigation('openYourProfile')}
      >
        <span className="more-page-avatar" aria-hidden="true">
          {avatarUrl && !avatarFailed ? (
            <img src={avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
          ) : initials ? (
            initials
          ) : (
            <UserRound size={25} strokeWidth={2.1} />
          )}
        </span>
        <span className="more-page-account-copy">
          <small>{navigation('yourAccount')}</small>
          <strong>{name || user.email}</strong>
          <span>{user.email}</span>
        </span>
        <span className="more-page-account-action" aria-hidden="true">
          <ChevronRight size={18} strokeWidth={2.3} />
        </span>
      </Link>

      <div className="more-page-groups">
        {menuGroups.map((group) => {
          const headingId = `${headingPrefix}-${group.id}`
          const groupLabel = navigation(group.id === 'account' ? 'account' : group.id === 'workspace' ? 'workspace' : 'helpLegal')

          return (
            <section key={group.id} className="more-page-section" aria-labelledby={headingId}>
              <h2 id={headingId}>{groupLabel}</h2>
              <div className="more-page-list">
                {group.items.map(({ href, label, description, icon: Icon }) => (
                  <Link key={href} href={appHref(href)} className="more-page-item">
                    <span className="more-page-item-icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={2.25} />
                    </span>
                    <span className="more-page-item-copy">
                      <strong>{routeLabel(href, label, navigation)}</strong>
                      <small>{routeDescription(href, description, navigation)}</small>
                    </span>
                    <ChevronRight className="more-page-item-chevron" size={18} strokeWidth={2.3} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="more-page-section more-page-session" aria-labelledby={`${headingPrefix}-session`}>
        <h2 id={`${headingPrefix}-session`}>{navigation('session')}</h2>
        <div className="more-page-session-card">
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
              <small>{auth('logoutDescription')}</small>
            </span>
          </button>
        </div>
      </section>

      <p className="more-page-version">{navigation('version', { version: packageMetadata.version })}</p>
    </div>
  )
}
