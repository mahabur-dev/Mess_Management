'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, ChevronLeft, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { canManageMess, hasActiveMess } from '@/lib/app-permissions'
import { appHref } from '@/lib/routes'
import { useTranslations } from '@/lib/i18n'

type AppHeaderProps = {
  title: string
  subtitle?: string
  backHref?: string
  leading?: ReactNode
  trailing?: ReactNode
  hasUnreadNotifications?: boolean
  variant?: 'default' | 'onboarding'
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
  const navigation = useTranslations('navigation')

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  return (
    <Link
      href={appHref('/profile')}
      className="app-header-action app-profile-link"
      aria-label={user?.name ? navigation('openProfile', { name: user.name }) : navigation('openYourProfile')}
      title={navigation('profile')}
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

export function NotificationLink({ hasUnreadNotifications = false }: { hasUnreadNotifications?: boolean }) {
  const { user } = useAuth()
  const canViewNotices = hasActiveMess(user) || canManageMess(user)
  const navigation = useTranslations('navigation')

  if (!canViewNotices) return <span className="h-11 w-11" aria-hidden="true" />

  return (
    <Link
      href={appHref('/notifications')}
      className="app-header-action"
      aria-label={hasUnreadNotifications ? navigation('openUnreadNotifications') : navigation('openNotifications')}
      title={navigation('notifications')}
    >
      <Bell size={19} strokeWidth={2.3} aria-hidden="true" />
      {hasUnreadNotifications ? <span className="app-header-notification-dot" aria-hidden="true" /> : null}
    </Link>
  )
}

export function AppHeader({
  title,
  subtitle,
  backHref,
  leading,
  trailing,
  hasUnreadNotifications = false,
  variant = 'default',
}: AppHeaderProps) {
  const router = useRouter()
  const headerRef = useRef<HTMLElement>(null)
  const navigation = useTranslations('navigation')

  const navigateBack = () => {
    if (backHref) {
      router.replace(appHref(backHref))
      return
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    }
  }

  const leadingContent =
    leading ??
    (backHref ? (
      <button type="button" className="app-header-action" onClick={navigateBack} aria-label={navigation('back')} title={navigation('back')}>
        <ChevronLeft size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
    ) : (
      <ProfileAvatarLink />
    ))
  const titleAlignment = !backHref && !leading ? 'text-left' : 'text-center'

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
    <header ref={headerRef} className="app-header top-hero px-4 pb-3" data-variant={variant}>
      <div className={`grid items-center gap-2 ${variant === 'onboarding' ? 'grid-cols-[52px_minmax(0,1fr)_52px]' : trailing ? 'grid-cols-[44px_minmax(0,1fr)_auto]' : 'grid-cols-[44px_minmax(0,1fr)_44px]'}`}>
        <div className="flex justify-start">{leadingContent}</div>
        <div className={`min-w-0 ${titleAlignment}`}>
          <h1 className={`ui-header-title truncate ${variant === 'onboarding' ? 'text-title' : 'text-title-sm'}`}>{title}</h1>
          {subtitle ? <p className={`${variant === 'onboarding' ? 'mt-1 text-label' : 'mt-0.5 text-caption'} truncate text-white/82`}>{subtitle}</p> : null}
        </div>
        <div className="flex justify-end">{trailing ?? <NotificationLink hasUnreadNotifications={hasUnreadNotifications} />}</div>
      </div>
    </header>
  )
}
