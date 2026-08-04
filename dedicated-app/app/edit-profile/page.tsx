'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { Camera, LoaderCircle, UserRound } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
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

export default function EditProfilePage() {
  const { user, refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? '')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const avatarUrl = user?.avatar_url?.trim() ?? ''
  const initials = getInitials(user?.name)

  useEffect(() => {
    if (!user) return
    setFullName(user.name ?? '')
    setPhoneNumber(user.phone ?? '')
    setImageFailed(false)
  }, [user])

  async function handleSave() {
    setMessage(null)
    setBusy(true)
    try {
      const data = new FormData()
      data.append('name', fullName.trim())
      if (phoneNumber.trim()) data.append('phone', phoneNumber.trim())
      if (profileImage) data.append('profileImage', profileImage)

      await api.updateProfile(data)
      await refresh()
      setMessage({ tone: 'success', text: 'Profile updated successfully.' })
      setProfileImage(null)
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

  return (
    <MobileShell>
      <TopScreen title="Edit Profile" subtitle="Update your personal information" backHref="/settings" />
      <div className="screen space-y-4">
        <section className="ui-card">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="grid h-18 w-18 place-items-center overflow-hidden rounded-[20px] bg-[#dff4f3] text-title font-bold text-[#00777a]">
                {avatarUrl && !imageFailed ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
                ) : initials ? (
                  <span aria-hidden="true">{initials}</span>
                ) : (
                  <UserRound size={28} strokeWidth={2.2} aria-hidden="true" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#008d8c] text-white shadow-sm transition active:scale-95">
                {uploadingPhoto ? (
                  <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Camera size={15} strokeWidth={2.4} aria-hidden="true" />
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="ui-card-title break-words">{user?.name ?? 'Account holder'}</h2>
              <p className="ui-card-subtitle mt-0.5 break-all">{user?.email ?? ''}</p>
            </div>
          </div>
        </section>

        <section className="ui-card space-y-4">
          <h2 className="ui-section-title">Personal information</h2>
          <TextField label="Full Name" value={fullName} onChange={setFullName} placeholder="Manager Name" />
          <TextField label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} placeholder="017xxxxxxxx" type="tel" />
          {message ? (
            <div className={`ui-notice ${message.tone === 'success' ? 'ui-notice--success' : 'ui-notice--danger'}`} role="status">
              {message.text}
            </div>
          ) : null}
          <SubmitButton busy={busy} onClick={() => void handleSave()}>
            Save Profile
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}