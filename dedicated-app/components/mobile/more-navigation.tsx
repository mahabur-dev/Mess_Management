'use client'

import { useId } from 'react'
import Link from 'next/link'
import { ChevronRight, LogOut } from 'lucide-react'
import { getMoreMenuGroups } from '@/lib/app-permissions'
import type { AuthUser } from '@/lib/auth'
import { useTranslations } from '@/lib/i18n'
import { routeDescription, routeLabel } from '@/lib/i18n/navigation'
import { appHref } from '@/lib/routes'
import packageMetadata from '@/package.json'

export function MoreNavigation({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const headingPrefix = useId()
  const navigation = useTranslations('navigation')
  const menuGroups = getMoreMenuGroups(user)

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
