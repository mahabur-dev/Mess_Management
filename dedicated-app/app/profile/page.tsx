'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { getActiveMemberships } from '@/lib/app-permissions'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

function getInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (!parts.length) return ''

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatRole(role?: string | null) {
  if (!role) return 'Member'
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

function formatDate(date?: string | null) {
  if (!date) return 'Not available'

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-[#e4eaec] py-3 last:border-b-0">
      <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="ui-caption">{label}</div>
        <div className="ui-label mt-0.5 break-words">{value}</div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarNotice, setAvatarNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const avatarUrl = user?.avatar_url?.trim() ?? ''
  const initials = getInitials(user?.name)
  const membership = useMemo(() => getActiveMemberships(user)[0], [user])
  const accountRole = formatRole(user?.role ?? membership?.role)
  const workspaceName = membership?.mess?.name ?? 'No workspace joined'
  const workspaceAddress = membership?.mess?.address?.trim() || 'Address not available'

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setAvatarNotice(null)
    if (!file.type.startsWith('image/')) {
      setAvatarNotice({ tone: 'error', text: 'Please select a valid image file.' })
      input.value = ''
      return
    }

    setIsUploadingAvatar(true)
    try {
      const data = new FormData()
      data.append('profileImage', file)
      await api.updateProfile(data)
      await refresh()
      setAvatarNotice({ tone: 'success', text: 'Profile photo updated successfully.' })
    } catch (error) {
      setAvatarNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile photo.',
      })
    } finally {
      setIsUploadingAvatar(false)
      input.value = ''
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Profile" subtitle="Account overview" backHref="/more" />

      <div className="screen space-y-4">
        <section className="ui-card" aria-labelledby="profile-name">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="grid h-18 w-18 place-items-center overflow-hidden rounded-[20px] bg-[#dff4f3] text-title font-bold text-[#00777a]">
                {avatarUrl && !imageFailed ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : initials ? (
                  <span aria-hidden="true">{initials}</span>
                ) : (
                  <UserRound size={28} strokeWidth={2.2} aria-hidden="true" />
                )}
              </div>

              <input
                ref={imageInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                tabIndex={-1}
              />
              <button
                type="button"
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#008d8c] text-white shadow-sm transition active:scale-95 disabled:opacity-70"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingAvatar}
                aria-label="Upload profile photo"
                title="Upload profile photo"
              >
                {isUploadingAvatar ? (
                  <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Camera size={15} strokeWidth={2.4} aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="ui-badge ui-badge--success">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#008d8c]" aria-hidden="true" />
                  Active
                </span>
                <span className="ui-badge ui-badge--neutral">{accountRole}</span>
              </div>
              <h2 id="profile-name" className="ui-card-title break-words">
                {user?.name ?? 'Account holder'}
              </h2>
              <p className="ui-card-subtitle break-all">{user?.email ?? 'Email not available'}</p>
            </div>
          </div>

          {avatarNotice ? (
            <div
              className={`ui-notice mt-4 ${avatarNotice.tone === 'success' ? 'ui-notice--success' : 'ui-notice--danger'}`}
              role="status"
            >
              {avatarNotice.text}
            </div>
          ) : null}

          <Link href={appHref('/settings')} className="ui-btn ui-btn--primary mt-5 w-full">
            <Pencil size={17} strokeWidth={2.3} aria-hidden="true" />
            Edit profile
          </Link>
        </section>

        <section className="ui-card" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="ui-section-title">
            Contact information
          </h2>
          <DetailRow icon={<Mail size={18} />} label="Email address" value={user?.email ?? 'Not provided'} />
          <DetailRow icon={<Phone size={18} />} label="Phone number" value={user?.phone?.trim() || 'Not provided'} />
        </section>

        <section className="ui-card" aria-labelledby="workspace-heading">
          <h2 id="workspace-heading" className="ui-section-title">
            Workspace access
          </h2>
          <DetailRow icon={<Building2 size={18} />} label="Workspace" value={workspaceName} />
          <DetailRow icon={<MapPin size={18} />} label="Location" value={workspaceAddress} />
          <DetailRow icon={<ShieldCheck size={18} />} label="Access level" value={accountRole} />
          <DetailRow icon={<CalendarDays size={18} />} label="Joined on" value={formatDate(membership?.joined_at)} />
        </section>

        <Link
          href={appHref('/settings')}
          className="ui-card flex min-h-16 items-center gap-3 transition-colors active:bg-[#edfafa]"
          aria-label="Open account settings"
        >
          <div className="ui-icon-tile ui-icon-tile--md bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
            <ShieldCheck size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="ui-label">Account settings</div>
            <div className="ui-caption mt-0.5">Profile details and security</div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
        </Link>
      </div>
    </MobileShell>
  )
}
