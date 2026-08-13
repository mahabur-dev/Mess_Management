'use client'

import { useId, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { LogOut, UserRound, X } from 'lucide-react'
import { useNativeBackAction } from '@/components/native-back-actions'
import { getMoreMenuGroups } from '@/lib/app-permissions'
import type { AuthUser } from '@/lib/auth'
import { appHref } from '@/lib/routes'
import packageMetadata from '@/package.json'

export function MoreDrawer({
  open,
  user,
  onClose,
  onLogout,
}: {
  open: boolean
  user: AuthUser
  onClose: () => void
  onLogout: () => void
}) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const menuGroups = getMoreMenuGroups(user)

  useNativeBackAction(open, () => {
    onClose()
    return true
  })

  useLayoutEffect(() => {
    if (!open) return

    const root = document.documentElement
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const previousOffset = root.style.getPropertyValue('--drawer-scroll-lock-offset')
    const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth)
    const hasStableScrollbarGutter = CSS.supports?.('scrollbar-gutter: stable') ?? false

    if (!hasStableScrollbarGutter && scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
      root.style.setProperty('--drawer-scroll-lock-offset', `${scrollbarWidth / 2}px`)
    }

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
      if (previousOffset) root.style.setProperty('--drawer-scroll-lock-offset', previousOffset)
      else root.style.removeProperty('--drawer-scroll-lock-offset')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  const initial = user.name.trim().charAt(0).toUpperCase() || 'M'

  return (
    <div className="more-drawer-layer" role="presentation">
      <button type="button" tabIndex={-1} className="more-drawer-backdrop" aria-label="Close More menu" onClick={onClose} />

      <aside ref={panelRef} id="more-navigation-drawer" className="more-drawer-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="more-drawer-header">
          <h2 id={titleId}>Messzen Menu</h2>
          <button ref={closeButtonRef} type="button" className="more-drawer-close" onClick={onClose} aria-label="Close More menu">
            <X size={20} strokeWidth={2.3} aria-hidden="true" />
          </button>
        </div>

        <div className="more-drawer-profile">
          <span className="more-drawer-avatar" aria-hidden="true">{initial}</span>
          <span className="more-drawer-profile-copy">
            <strong>{user.name || 'Your account'}</strong>
            <small>{user.email}</small>
          </span>
          <UserRound size={18} strokeWidth={2.2} aria-hidden="true" />
        </div>

        <div className="more-drawer-scroll">
          {menuGroups.map((group) => (
            <section key={group.id} className="more-drawer-group" aria-labelledby={`${titleId}-${group.id}`}>
              <h3 id={`${titleId}-${group.id}`}>{group.label}</h3>
              <div className="more-drawer-list">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={appHref(href)} className="more-drawer-item" onClick={onClose}>
                    <span className="more-drawer-item-icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={2.25} />
                    </span>
                    <span className="more-drawer-item-copy">
                      <strong>{label}</strong>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <button
            type="button"
            className="more-drawer-logout"
            onClick={() => {
              onClose()
              onLogout()
            }}
          >
            <span className="more-drawer-item-icon" aria-hidden="true">
              <LogOut size={19} strokeWidth={2.25} />
            </span>
            <span>Log out</span>
          </button>

          <p className="more-drawer-version">Messzen version {packageMetadata.version}</p>
        </div>
      </aside>
    </div>
  )
}
