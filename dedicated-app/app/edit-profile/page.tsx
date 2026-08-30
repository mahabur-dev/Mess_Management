'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, LoaderCircle } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import {
  ProfileDocumentUpload,
  ProfileIdentityCard,
  ProfileSection,
} from '@/components/mobile/profile-ui'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { getActiveMemberships } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'
import { useAuth } from '../providers'

const MAX_NID_IMAGE_SIZE = 5 * 1024 * 1024

export default function EditProfilePage() {
  const { user, refresh } = useAuth()
  const { locale } = useLocale()
  const common = useTranslations('common')
  const auth = useTranslations('auth')
  const members = useTranslations('members')
  const profile = useTranslations('profile')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? '')
  const [nidNumber, setNidNumber] = useState(user?.nid_number ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [state, setState] = useState(user?.state ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [zipcode, setZipcode] = useState(user?.zipcode ?? '')
  const [nidImage, setNidImage] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useAutoDismiss(message, () => setMessage(null))

  const membership = useMemo(() => getActiveMemberships(user)[0], [user])
  const rawRole = (membership?.role ?? user?.role ?? 'MEMBER').toUpperCase()
  const accountRole = rawRole.includes('ADMIN')
    ? profile('administrator')
    : rawRole === 'MANAGER'
      ? members('manager')
      : members('member')
  const isActive = user?.is_active !== false

  useEffect(() => {
    if (!user) return
    setFullName(user.name ?? '')
    setEmail(user.email ?? '')
    setPhoneNumber(user.phone ?? '')
    setNidNumber(user.nid_number ?? '')
    setLocation(user.location ?? '')
    setState(user.state ?? '')
    setCity(user.city ?? '')
    setZipcode(user.zipcode ?? '')
  }, [user])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!fullName.trim()) {
      setMessage({ tone: 'error', text: profile('fullNameRequired') })
      return
    }

    if (!email.trim()) {
      setMessage({ tone: 'error', text: profile('emailRequired') })
      return
    }

    setBusy(true)
    try {
      const data = new FormData()
      data.append('name', fullName.trim())
      data.append('email', email.trim().toLowerCase())
      data.append('phone', phoneNumber.trim())
      data.append('nidNumber', nidNumber.trim())
      data.append('location', location.trim())
      data.append('state', state.trim())
      data.append('city', city.trim())
      data.append('zipcode', zipcode.trim())
      if (nidImage) data.append('nidImage', nidImage)

      await api.updateProfile(data)
      await refresh()
      setNidImage(null)
      setMessage({ tone: 'success', text: profile('profileUpdated') })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: localizedErrorMessage(error, locale),
      })
    } finally {
      setBusy(false)
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setMessage(null)
    if (!file.type.startsWith('image/')) {
      setMessage({ tone: 'error', text: profile('validImageRequired') })
      input.value = ''
      return
    }

    setUploadingPhoto(true)
    try {
      const data = new FormData()
      data.append('profileImage', file)
      await api.updateProfile(data)
      await refresh()
      setMessage({ tone: 'success', text: profile('profilePhotoUpdated') })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: localizedErrorMessage(error, locale),
      })
    } finally {
      setUploadingPhoto(false)
      input.value = ''
    }
  }

  function handleNidImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setMessage(null)
    if (!file.type.startsWith('image/')) {
      setMessage({ tone: 'error', text: profile('validNidImageRequired') })
      input.value = ''
      return
    }

    if (file.size > MAX_NID_IMAGE_SIZE) {
      setMessage({ tone: 'error', text: profile('nidImageTooLarge') })
      input.value = ''
      return
    }

    setNidImage(file)
  }

  return (
    <MobileShell>
      <TopScreen title={profile('editProfile')} subtitle={profile('editProfileDescription')} backHref="/profile" />

      <div className="screen profile-page profile-edit-page">
        <ProfileIdentityCard
          id="edit-profile-name"
          name={user?.name}
          imageUrl={user?.avatar_url}
          status={isActive ? common('active') : common('inactive')}
          active={isActive}
          role={accountRole}
          avatarAction={(
            <label className="profile-avatar-action" aria-label={profile('uploadProfilePhoto')}>
              {uploadingPhoto ? (
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Camera size={16} strokeWidth={2.4} aria-hidden="true" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
          )}
        />

        <form className="profile-edit-form" onSubmit={handleSave}>
          <ProfileSection
            id="account-information-heading"
            title={profile('accountInformation')}
          >
            <TextField
              label={auth('fullName')}
              value={fullName}
              onChange={setFullName}
              placeholder={profile('enterFullName')}
              autoComplete="name"
              maxLength={100}
              required
            />
            <TextField
              label={auth('emailAddress')}
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              maxLength={255}
              required
            />
            <TextField
              label={auth('phoneNumber')}
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="017xxxxxxxx"
              type="tel"
              autoComplete="tel"
              maxLength={40}
            />
          </ProfileSection>

          <ProfileSection
            id="identity-information-heading"
            title={profile('identityVerification')}
          >
            <TextField
              label={profile('nidNumber')}
              value={nidNumber}
              onChange={setNidNumber}
              placeholder={profile('enterNidNumber')}
              inputMode="numeric"
              maxLength={32}
            />
            <ProfileDocumentUpload
              existingImageUrl={user?.nid_image_url}
              selectedFile={nidImage}
              disabled={busy}
              onChange={handleNidImageChange}
            />
          </ProfileSection>

          <ProfileSection
            id="address-information-heading"
            title={profile('addressInformation')}
          >
            <TextField
              label={auth('location')}
              value={location}
              onChange={setLocation}
              placeholder={profile('houseRoadArea')}
              autoComplete="address-line1"
              maxLength={255}
            />
            <div className="profile-form-grid">
              <TextField
                label={profile('state')}
                value={state}
                onChange={setState}
                placeholder={profile('stateDivision')}
                autoComplete="address-level1"
                maxLength={100}
              />
              <TextField
                label={profile('city')}
                value={city}
                onChange={setCity}
                placeholder={profile('city')}
                autoComplete="address-level2"
                maxLength={100}
              />
            </div>
            <TextField
              label={profile('zipCode')}
              value={zipcode}
              onChange={setZipcode}
              placeholder={profile('postalCode')}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={20}
            />
          </ProfileSection>

          {message ? (
            <div
              className={`ui-notice ${message.tone === 'success' ? 'ui-notice--success' : 'ui-notice--danger'}`}
              role="status"
            >
              {message.text}
            </div>
          ) : null}

          <div className="profile-save-action">
            <SubmitButton type="submit" busy={busy}>
              {profile('saveProfile')}
            </SubmitButton>
          </div>
        </form>
      </div>
    </MobileShell>
  )
}
