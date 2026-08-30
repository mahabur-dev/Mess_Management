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
  ProfileDetailRow,
  ProfileDocumentCard,
  ProfileIdentityCard,
  ProfileSection,
} from '@/components/mobile/profile-ui'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { getActiveMemberships } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { localizedErrorMessage, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { useAuth } from '../providers'

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const common = useTranslations('common')
  const auth = useTranslations('auth')
  const members = useTranslations('members')
  const profile = useTranslations('profile')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarNotice, setAvatarNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  useAutoDismiss(avatarNotice, () => setAvatarNotice(null))

  const membership = useMemo(() => getActiveMemberships(user)[0], [user])
  const rawRole = (membership?.role ?? user?.role ?? 'MEMBER').toUpperCase()
  const accountRole = rawRole.includes('ADMIN')
    ? profile('administrator')
    : rawRole === 'MANAGER'
      ? members('manager')
      : members('member')
  const isActive = user?.is_active !== false
  const workspaceName = membership?.mess?.name ?? profile('noWorkspace')
  const workspaceAddress = membership?.mess?.address?.trim() || profile('addressUnavailable')
  const profileValue = (value?: string | null) => value?.trim() || common('notProvided')

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setAvatarNotice(null)
    if (!file.type.startsWith('image/')) {
      setAvatarNotice({ tone: 'error', text: profile('validImageRequired') })
      input.value = ''
      return
    }

    setIsUploadingAvatar(true)
    try {
      const data = new FormData()
      data.append('profileImage', file)
      await api.updateProfile(data)
      await refresh()
      setAvatarNotice({ tone: 'success', text: profile('profilePhotoUpdated') })
    } catch (error) {
      setAvatarNotice({
        tone: 'error',
        text: localizedErrorMessage(error, locale) || profile('profilePhotoFailed'),
      })
    } finally {
      setIsUploadingAvatar(false)
      input.value = ''
    }
  }

  return (
    <MobileShell>
      <TopScreen title={profile('title')} subtitle={profile('accountOverview')} backHref="/" />

      <div className="screen profile-page">
        <ProfileIdentityCard
          id="profile-name"
          name={user?.name}
          imageUrl={user?.avatar_url}
          status={isActive ? common('active') : common('inactive')}
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
                aria-label={profile('uploadProfilePhoto')}
                title={profile('uploadProfilePhoto')}
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
            {profile('editProfile')}
          </Link>
        </ProfileIdentityCard>

        <ProfileSection id="contact-heading" title={profile('contactInformation')}>
          <div className="profile-detail-list">
            <ProfileDetailRow
              icon={<Mail size={18} />}
              label={auth('emailAddress')}
              value={profileValue(user?.email)}
            />
            <ProfileDetailRow
              icon={<Phone size={18} />}
              label={auth('phoneNumber')}
              value={profileValue(user?.phone)}
            />
          </div>
        </ProfileSection>

        <ProfileSection id="identity-heading" title={profile('identityVerification')}>
          <div className="profile-detail-list">
            <ProfileDetailRow
              icon={<Fingerprint size={18} />}
              label={profile('nidNumber')}
              value={profileValue(user?.nid_number)}
            />
          </div>
          <ProfileDocumentCard imageUrl={user?.nid_image_url} />
        </ProfileSection>

        <ProfileSection id="address-heading" title={profile('addressInformation')}>
          <div className="profile-detail-list">
            <ProfileDetailRow
              icon={<MapPin size={18} />}
              label={auth('location')}
              value={profileValue(user?.location)}
            />
            <ProfileDetailRow
              icon={<Map size={18} />}
              label={profile('state')}
              value={profileValue(user?.state)}
            />
            <ProfileDetailRow
              icon={<Building2 size={18} />}
              label={profile('city')}
              value={profileValue(user?.city)}
            />
            <ProfileDetailRow
              icon={<Navigation size={18} />}
              label={profile('zipCode')}
              value={profileValue(user?.zipcode)}
            />
          </div>
        </ProfileSection>

        <ProfileSection id="workspace-heading" title={profile('workspaceAccess')}>
          <div className="profile-detail-list">
            <ProfileDetailRow icon={<Building2 size={18} />} label={profile('workspace')} value={workspaceName} />
            <ProfileDetailRow icon={<MapPin size={18} />} label={auth('location')} value={workspaceAddress} />
            <ProfileDetailRow icon={<ShieldCheck size={18} />} label={profile('accessLevel')} value={accountRole} />
            <ProfileDetailRow
              icon={<CalendarDays size={18} />}
              label={profile('joinedOn')}
              value={membership?.joined_at ? format.date(membership.joined_at) : common('notAvailable')}
            />
          </div>
        </ProfileSection>

        <Link
          href={appHref('/settings')}
          className="profile-settings-card"
          aria-label={profile('openAccountSettings')}
        >
          <span className="profile-settings-card__icon" aria-hidden="true">
            <ShieldCheck size={19} />
          </span>
          <span className="profile-settings-card__copy">
            <strong>{profile('accountSettings')}</strong>
            <span>{profile('profileSecurityDescription')}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </MobileShell>
  )
}
