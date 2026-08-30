'use client'

import {
  CheckCircle2,
  ExternalLink,
  FileImage,
  ImagePlus,
  UserRound,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { useTranslations } from '@/lib/i18n'

export function getProfileInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (!parts.length) return ''

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatProfileRole(role?: string | null) {
  if (!role) return 'Member'
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export function ProfileAvatar({
  name,
  imageUrl,
}: {
  name?: string | null
  imageUrl?: string | null
}) {
  const profile = useTranslations('profile')
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedImageUrl = imageUrl?.trim() ?? ''
  const initials = getProfileInitials(name)

  useEffect(() => {
    setImageFailed(false)
  }, [normalizedImageUrl])

  return (
    <div className="profile-avatar">
      {normalizedImageUrl && !imageFailed ? (
        <img
          src={normalizedImageUrl}
          alt={profile('userProfileAlt', { name: name?.trim() || profile('accountHolder') })}
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserRound size={31} strokeWidth={2.1} aria-hidden="true" />
      )}
    </div>
  )
}

export function ProfileIdentityCard({
  id,
  name,
  imageUrl,
  status,
  active = true,
  role,
  avatarAction,
  children,
}: {
  id: string
  name?: string | null
  imageUrl?: string | null
  status: string
  active?: boolean
  role: string
  avatarAction?: ReactNode
  children?: ReactNode
}) {
  const profile = useTranslations('profile')
  return (
    <section className="profile-identity-card" aria-labelledby={id}>
      <span className="profile-identity-card__glow" aria-hidden="true" />
      <span className="profile-identity-card__dots" aria-hidden="true" />

      <div className="profile-avatar-shell">
        <ProfileAvatar name={name} imageUrl={imageUrl} />
        {avatarAction}
      </div>

      <h2 id={id} className="profile-identity-card__name">
        {name?.trim() || profile('accountHolder')}
      </h2>

      <div className="profile-identity-card__badges">
        <span className={`profile-status-badge ${active ? 'profile-status-badge--active' : 'profile-status-badge--inactive'}`}>
          <span aria-hidden="true" />
          {status}
        </span>
        <span className="profile-role-badge">{role}</span>
      </div>

      {children ? <div className="profile-identity-card__actions">{children}</div> : null}
    </section>
  )
}

export function ProfileSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="profile-section" aria-labelledby={id}>
      <header className="profile-section__header">
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="profile-section__content">{children}</div>
    </section>
  )
}

export function ProfileDetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="profile-detail-row">
      <span className="profile-detail-row__icon" aria-hidden="true">{icon}</span>
      <div className="profile-detail-row__copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

export function ProfileDocumentCard({ imageUrl }: { imageUrl?: string | null }) {
  const profile = useTranslations('profile')
  if (!imageUrl?.trim()) {
    return (
      <div className="profile-document-empty">
        <FileImage size={19} aria-hidden="true" />
        <span>{profile('nidImageNotUploaded')}</span>
      </div>
    )
  }

  return (
    <a
      href={imageUrl}
      target="_blank"
      rel="noreferrer"
      className="profile-document-card"
      aria-label={profile('openNidImage')}
    >
      <img src={imageUrl} alt={profile('uploadedNidDocument')} />
      <span className="profile-document-card__copy">
        <span>{profile('nidDocument')}</span>
        <strong>{profile('viewUploadedImage')}</strong>
      </span>
      <ExternalLink size={17} aria-hidden="true" />
    </a>
  )
}

export function ProfileDocumentUpload({
  existingImageUrl,
  selectedFile,
  disabled,
  onChange,
}: {
  existingImageUrl?: string | null
  selectedFile: File | null
  disabled?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const profile = useTranslations('profile')
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl?.trim() ?? '')

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(existingImageUrl?.trim() ?? '')
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [existingImageUrl, selectedFile])

  return (
    <div className="profile-document-upload">
      <div className="profile-document-upload__preview" aria-hidden="true">
        {previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : (
          <FileImage size={25} />
        )}
      </div>

      <div className="profile-document-upload__copy">
        <strong>{selectedFile ? selectedFile.name : previewUrl ? profile('nidImageUploaded') : profile('uploadNidImage')}</strong>
        <span>{profile('imageRequirements')}</span>
      </div>

      <label className="profile-document-upload__action">
        {previewUrl ? <CheckCircle2 size={16} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
        <span>{previewUrl ? profile('change') : profile('choose')}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onChange}
          disabled={disabled}
        />
      </label>
    </div>
  )
}
