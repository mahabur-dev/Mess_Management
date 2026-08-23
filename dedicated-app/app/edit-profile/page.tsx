'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, LoaderCircle } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import {
  formatProfileRole,
  ProfileDocumentUpload,
  ProfileIdentityCard,
  ProfileSection,
} from '@/components/mobile/profile-ui'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { getActiveMemberships } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

const MAX_NID_IMAGE_SIZE = 5 * 1024 * 1024

export default function EditProfilePage() {
  const { user, refresh } = useAuth()
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
  const accountRole = formatProfileRole(membership?.role ?? user?.role)
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
      setMessage({ tone: 'error', text: 'Full name is required.' })
      return
    }

    if (!email.trim()) {
      setMessage({ tone: 'error', text: 'Email address is required.' })
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
      setMessage({ tone: 'success', text: 'Profile updated successfully.' })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile.',
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
      setMessage({ tone: 'error', text: 'Please select a valid image file.' })
      input.value = ''
      return
    }

    setUploadingPhoto(true)
    try {
      const data = new FormData()
      data.append('profileImage', file)
      await api.updateProfile(data)
      await refresh()
      setMessage({ tone: 'success', text: 'Profile photo updated successfully.' })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile photo.',
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
      setMessage({ tone: 'error', text: 'Please select a valid NID image.' })
      input.value = ''
      return
    }

    if (file.size > MAX_NID_IMAGE_SIZE) {
      setMessage({ tone: 'error', text: 'NID image must be 5 MB or smaller.' })
      input.value = ''
      return
    }

    setNidImage(file)
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Profile" subtitle="Update your personal information" backHref="/profile" />

      <div className="screen profile-page profile-edit-page">
        <ProfileIdentityCard
          id="edit-profile-name"
          name={user?.name}
          imageUrl={user?.avatar_url}
          status={isActive ? 'Active' : 'Inactive'}
          active={isActive}
          role={accountRole}
          avatarAction={(
            <label className="profile-avatar-action" aria-label="Upload profile photo">
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
            title="Account information"
            description="Your primary contact and account details"
          >
            <TextField
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={100}
              required
            />
            <TextField
              label="Email Address"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              maxLength={255}
              required
            />
            <TextField
              label="Phone Number"
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
            title="Identity verification"
            description="Add your NID details for account identification"
          >
            <TextField
              label="NID Number"
              value={nidNumber}
              onChange={setNidNumber}
              placeholder="Enter your NID number"
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
            title="Address information"
            description="Your current location and postal details"
          >
            <TextField
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="House, road or area"
              autoComplete="address-line1"
              maxLength={255}
            />
            <div className="profile-form-grid">
              <TextField
                label="State"
                value={state}
                onChange={setState}
                placeholder="State or division"
                autoComplete="address-level1"
                maxLength={100}
              />
              <TextField
                label="City"
                value={city}
                onChange={setCity}
                placeholder="City"
                autoComplete="address-level2"
                maxLength={100}
              />
            </div>
            <TextField
              label="Zip Code"
              value={zipcode}
              onChange={setZipcode}
              placeholder="Postal or zip code"
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
              Save Profile
            </SubmitButton>
          </div>
        </form>
      </div>
    </MobileShell>
  )
}
