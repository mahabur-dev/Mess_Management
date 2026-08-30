'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, LogOut, UserRound } from 'lucide-react'
import { getMoreMenuGroups } from '@/lib/app-permissions'
import type { AuthUser } from '@/lib/auth'
import { useTranslations } from '@/lib/i18n'
import { routeDescription, routeLabel } from '@/lib/i18n/navigation'
import { appHref } from '@/lib/routes'
import packageMetadata from '@/package.json'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function MoreAccountCard({ user }: { user: AuthUser }) {
  const [imageFailed, setImageFailed] = useState(false)
  const avatarUrl = user.avatar_url?.trim() ?? ''
  const initials = getInitials(user.name)
  const navigation = useTranslations('navigation')

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  return (
    <Link
      href={appHref('/profile')}
      className="more-page-account"
      aria-label={user.name ? navigation('openProfile', { name: user.name }) : navigation('openYourProfile')}
    >
      <span className="more-page-avatar" aria-hidden="true">
        {avatarUrl && !imageFailed ? (
          <img src={avatarUrl} alt="" onError={() => setImageFailed(true)} />
        ) : initials ? (
          initials
        ) : (
          <UserRound size={24} strokeWidth={2.2} />
        )}
      </span>
      <span className="more-page-account-copy">
        <small>{navigation('yourAccount')}</small>
        <strong>{user.name || navigation('yourAccount')}</strong>
        <span>{user.email}</span>
      </span>
      <span className="more-page-account-action" aria-hidden="true">
        <ChevronRight size={19} strokeWidth={2.4} />
      </span>
    </Link>
  )
}

export function MoreNavigation({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const headingPrefix = useId()
  const navigation = useTranslations('navigation')
  const menuGroups = getMoreMenuGroups(user)

  return (
    <div className="screen more-page">
      <MoreAccountCard user={user} />

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

      <button type="button" className="more-page-logout" onClick={onLogout}>
        <span className="more-page-item-icon" aria-hidden="true">
          <LogOut size={20} strokeWidth={2.25} />
        </span>
        <span>{navigation('logOut')}</span>
      </button>

      <p className="more-page-version">{navigation('version', { version: packageMetadata.version })}</p>
    </div>
  )
}
