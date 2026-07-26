'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, ChevronLeft, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { canManageMess, hasActiveMess } from '@/lib/app-permissions'
import { appHref } from '@/lib/routes'

type AppHeaderProps = {
  title: string
  subtitle?: string
  backHref?: string
  leading?: ReactNode
  trailing?: ReactNode
  hasUnreadNotices?: boolean
}

function getInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (!parts.length) return ''
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function ProfileAvatarLink() {
  const { user } = useAuth()
  const [imageFailed, setImageFailed] = useState(false)
  const avatarUrl = user?.avatar_url?.trim() ?? ''
  const initials = getInitials(user?.name)

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  return (
    <Link
      href={appHref('/profile')}
      className="app-header-action app-profile-link"
      aria-label={`Open ${user?.name ? `${user.name}'s` : 'your'} profile`}
      title="Profile"
    >
      {avatarUrl && !imageFailed ? (
        // The API returns the uploaded image URL, which may be hosted outside the app origin.
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserRound size={19} strokeWidth={2.3} aria-hidden="true" />
      )}
    </Link>
  )
}

function NotificationLink({ hasUnreadNotices = false }: { hasUnreadNotices?: boolean }) {
  const { user } = useAuth()
  const canViewNotices = hasActiveMess(user) || canManageMess(user)

  if (!canViewNotices) return <span className="h-11 w-11" aria-hidden="true" />

  return (
    <Link
      href={appHref('/notices')}
      className="app-header-action"
      aria-label={hasUnreadNotices ? 'Open notices, unread notices available' : 'Open notices'}
      title="Notices"
    >
      <Bell size={19} strokeWidth={2.3} aria-hidden="true" />
      {hasUnreadNotices ? <span className="app-header-notification-dot" aria-hidden="true" /> : null}
    </Link>
  )
}

export function AppHeader({
  title,
  subtitle,
  backHref,
  leading,
  trailing,
  hasUnreadNotices = false,
}: AppHeaderProps) {
  const router = useRouter()
  const headerRef = useRef<HTMLElement>(null)

  const navigateBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    if (backHref) router.replace(appHref(backHref))
  }

  const leadingContent =
    leading ??
    (backHref ? (
      <button type="button" className="app-header-action" onClick={navigateBack} aria-label="Go to previous page" title="Back">
        <ChevronLeft size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
    ) : (
      <ProfileAvatarLink />
    ))

  useEffect(() => {
    const header = headerRef.current
    const shell = header?.closest<HTMLElement>('.phone-frame')
    if (!header || !shell) return

    const syncHeaderInset = () => {
      shell.style.setProperty('--app-header-inset', `${Math.ceil(header.getBoundingClientRect().height)}px`)
    }

    syncHeaderInset()
    const observer = new ResizeObserver(syncHeaderInset)
    observer.observe(header)

    return () => observer.disconnect()
  }, [])

  return (
    <header ref={headerRef} className="app-header top-hero px-4 pb-3">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
        <div className="flex justify-start">{leadingContent}</div>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-title-sm font-bold text-white">{title}</h1>
          {subtitle ? <p className="mt-0.5 truncate text-caption text-white/80">{subtitle}</p> : null}
        </div>
        <div className="flex justify-end">{trailing ?? <NotificationLink hasUnreadNotices={hasUnreadNotices} />}</div>
      </div>
    </header>
  )
}
