'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import {
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  Fingerprint,
  LoaderCircle,
  Mail,
  Map,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  formatProfileRole,
  ProfileDetailRow,
  ProfileDocumentCard,
  ProfileIdentityCard,
  ProfileSection,
} from '@/components/mobile/profile-ui'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { getActiveMemberships } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

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

function profileValue(value?: string | null) {
  return value?.trim() || 'Not provided'
}

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarNotice, setAvatarNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  useAutoDismiss(avatarNotice, () => setAvatarNotice(null))

  const membership = useMemo(() => getActiveMemberships(user)[0], [user])
  const accountRole = formatProfileRole(membership?.role ?? user?.role)
  const isActive = user?.is_active !== false
  const workspaceName = membership?.mess?.name ?? 'No workspace joined'
  const workspaceAddress = membership?.mess?.address?.trim() || 'Address not available'

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
      <TopScreen title="Profile" subtitle="Account overview" backHref="/" />

      <div className="screen profile-page">
        <ProfileIdentityCard
          id="profile-name"
          name={user?.name}
          imageUrl={user?.avatar_url}
          status={isActive ? 'Active' : 'Inactive'}
          active={isActive}
          role={accountRole}
          avatarAction={(
            <>
              <input
                ref={imageInputRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                tabIndex={-1}
              />
              <button
                type="button"
                className="profile-avatar-action"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingAvatar}
                aria-label="Upload profile photo"
                title="Upload profile photo"
              >
                {isUploadingAvatar ? (
                  <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Camera size={16} strokeWidth={2.4} aria-hidden="true" />
                )}
              </button>
            </>
          )}
        >
          {avatarNotice ? (
            <div
              className={`ui-notice ${avatarNotice.tone === 'success' ? 'ui-notice--success' : 'ui-notice--danger'}`}
              role="status"
            >
              {avatarNotice.text}
            </div>
          ) : null}

          <Link href={appHref('/edit-profile')} className="ui-btn ui-btn--primary profile-edit-action">
            <Pencil size={16} strokeWidth={2.3} aria-hidden="true" />
            Edit profile
          </Link>
        </ProfileIdentityCard>

        <ProfileSection id="contact-heading" title="Contact information">
          <div className="profile-detail-list">
            <ProfileDetailRow
              icon={<Mail size={18} />}
              label="Email address"
              value={profileValue(user?.email)}
            />
            <ProfileDetailRow
              icon={<Phone size={18} />}
              label="Phone number"
              value={profileValue(user?.phone)}
            />
          </div>
        </ProfileSection>

        <ProfileSection id="identity-heading" title="Identity verification">
          <div className="profile-detail-list">
            <ProfileDetailRow
              icon={<Fingerprint size={18} />}
              label="NID number"
              value={profileValue(user?.nid_number)}
            />
          </div>
          <ProfileDocumentCard imageUrl={user?.nid_image_url} />
        </ProfileSection>

        <ProfileSection id="address-heading" title="Address information">
          <div className="profile-detail-list">
            <ProfileDetailRow
              icon={<MapPin size={18} />}
              label="Location"
              value={profileValue(user?.location)}
            />
            <ProfileDetailRow
              icon={<Map size={18} />}
              label="State"
              value={profileValue(user?.state)}
            />
            <ProfileDetailRow
              icon={<Building2 size={18} />}
              label="City"
              value={profileValue(user?.city)}
            />
            <ProfileDetailRow
              icon={<Navigation size={18} />}
              label="Zip code"
              value={profileValue(user?.zipcode)}
            />
          </div>
        </ProfileSection>

        <ProfileSection id="workspace-heading" title="Workspace access">
          <div className="profile-detail-list">
            <ProfileDetailRow icon={<Building2 size={18} />} label="Workspace" value={workspaceName} />
            <ProfileDetailRow icon={<MapPin size={18} />} label="Location" value={workspaceAddress} />
            <ProfileDetailRow icon={<ShieldCheck size={18} />} label="Access level" value={accountRole} />
            <ProfileDetailRow
              icon={<CalendarDays size={18} />}
              label="Joined on"
              value={formatDate(membership?.joined_at)}
            />
          </div>
        </ProfileSection>

        <Link
          href={appHref('/settings')}
          className="profile-settings-card"
          aria-label="Open account settings"
        >
          <span className="profile-settings-card__icon" aria-hidden="true">
            <ShieldCheck size={19} />
          </span>
          <span className="profile-settings-card__copy">
            <strong>Account settings</strong>
            <span>Profile details and security</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </MobileShell>
  )
}
