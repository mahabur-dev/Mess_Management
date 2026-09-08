'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { Bell, Eye, EyeOff, Upload, User, Lock, ShieldAlert, Camera, Save, KeyRound, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { toast } from '@/hooks/use-toast'
import { roleLabel, useLocale, useTranslations } from '@/lib/i18n'

// ── API base URL ──────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function apiUpdateProfile(formData: FormData) {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),       // no Content-Type — browser sets multipart boundary
    body: formData,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Failed to update profile')
  return json.data
}

async function apiChangePassword(oldPassword: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Failed to change password')
  return json
}

async function apiDeleteAccount(userId: string) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Failed to delete account')
  return json
}

// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['var(--primary)']

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function SettingsPage() {
  const { user, updateUserLocally } = useAuth()
  const { locale } = useLocale()
  const t = useTranslations('settingsPage')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(
    user?.avatar_url || null,
  )
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // ── Password state ─────────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  })
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)

  // ── Notifications state ────────────────────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  // ── Delete confirm state ───────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // ── Avatar select ──────────────────────────────────────────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('error'), description: t('imageTooLarge'), variant: 'destructive' })
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setProfilePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      toast({ title: t('error'), description: t('nameRequired'), variant: 'destructive' })
      return
    }

    try {
      setIsLoadingProfile(true)

      const formData = new FormData()
      formData.append('name', profileData.name.trim())
      formData.append('phone', profileData.phone.trim())
      if (avatarFile) {
        formData.append('profileImage', avatarFile)   // matches backend: file.fieldname
      }

      const updated = await apiUpdateProfile(formData)

      // sync auth context so navbar/header reflects the new name/avatar
      updateUserLocally({
        name: updated.name,
        phone: updated.phone,
        avatar_url: updated.avatar_url,
      })

      setProfileData({ name: updated.name, phone: updated.phone ?? '' })
      setProfilePreview(updated.avatar_url || null)
      setAvatarFile(null)

      toast({ title: t('success'), description: t('profileUpdated') })
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('profileUpdateFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword) {
      toast({ title: t('error'), description: t('currentPasswordRequired'), variant: 'destructive' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: t('error'), description: t('passwordLength'), variant: 'destructive' })
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: t('error'), description: t('passwordMismatch'), variant: 'destructive' })
      return
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      toast({ title: t('error'), description: t('passwordMustDiffer'), variant: 'destructive' })
      return
    }

    try {
      setIsLoadingPassword(true)
      await apiChangePassword(passwordData.oldPassword, passwordData.newPassword)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast({ title: t('success'), description: t('passwordChanged') })
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('passwordChangeFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsLoadingPassword(false)
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user?.id) return
    try {
      setIsDeletingAccount(true)
      await apiDeleteAccount(user.id)
      toast({ title: t('accountDeleted'), description: t('accountDeletedDescription') })
      // redirect to login or call logout from auth context
      window.location.href = '/login'
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('accountDeleteFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }

  const avatarBg = avatarColor(user?.name || 'User')

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-7">

        {/* ── Profile Section ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-background ">
          <div className="border-b border-border  bg-muted via-white  px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="dashboard-section-icon size-11 rounded-lg">
                <User size={22} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('account')}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{t('profileInformation')}</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('profilePicture')}
                </label>
                <div className="flex items-center gap-5">
                  <div
                    className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 text-3xl font-semibold shadow-inner"
                    style={{
                      backgroundColor: 'var(--muted)',
                      borderColor: 'var(--border)',
                      color: avatarBg,
                    }}
                  >
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt={t('profilePreview')}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      getInitials(user?.name || 'User')
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-bold text-muted-foreground transition hover:border-primary hover:bg-muted"
                    >
                      <Camera size={15} className="text-primary" />
                      {t('chooseImage')}
                    </button>
                    <p className="text-[10px] font-semibold text-muted-foreground">{t('imageHint')}</p>
                    {avatarFile && (
                      <p className="flex items-center gap-1 text-[11px] font-bold text-primary">
                        <CheckCircle2 size={13} />
                        {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>

              {/* Email — read only */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-[48px] w-full rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-muted-foreground outline-none cursor-not-allowed"
                />
                <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{t('emailReadonly')}</p>
              </div>

              {/* Role — read only */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('role')}
                </label>
                <input
                  type="text"
                  value={roleLabel(user?.role ?? 'MEMBER', locale)}
                  disabled
                  className="h-[48px] w-full rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-muted-foreground outline-none cursor-not-allowed"
                />
                <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{t('roleReadonly')}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoadingProfile}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition  disabled:opacity-70"
                >
                  {isLoadingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isLoadingProfile ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Security Section ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-background ">
          <div className="border-b border-border  bg-muted via-white  px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="dashboard-section-icon size-11 rounded-lg">
                <Lock size={22} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('security')}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{t('changePassword')}</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              {/* Current password */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('currentPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))
                    }
                    className="h-[48px] w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, old: !prev.old }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-muted-foreground"
                  >
                    {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    className="h-[48px] w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-muted-foreground"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-destructive">
                    <XCircle size={13} />
                    {t('passwordLengthShort')}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className="h-[48px] w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-muted-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-destructive">
                      <XCircle size={13} />
                      {t('passwordMismatch')}
                    </p>
                  )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoadingPassword}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition  disabled:opacity-70"
                >
                  {isLoadingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {isLoadingPassword ? t('changing') : t('changePassword')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notifications Section ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-background ">
          <div className="border-b border-border  bg-muted via-white  px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="dashboard-section-icon size-11 rounded-lg">
                <Bell size={22} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('preferences')}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{t('notifications')}</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-4 transition hover:border-primary">
                <div>
                  <p className="text-sm font-bold text-foreground">{t('emailNotifications')}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{t('emailNotificationsHint')}</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                    emailNotifications ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-background  transition ${
                      emailNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-4 transition hover:border-primary">
                <div>
                  <p className="text-sm font-bold text-foreground">{t('pushNotifications')}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{t('pushNotificationsHint')}</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                    pushNotifications ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-background  transition ${
                      pushNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border  bg-muted  p-4">
                <Bell size={18} className="shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">{t('smartNotifications')}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {t('smartNotificationsHint')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="overflow-hidden rounded-xl border border-destructive/30 bg-background ">
          <div className="border-b border-destructive/30  bg-destructive/10 via-white  px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl r bg-destructive/10  ">
                <ShieldAlert size={22} className="text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">{t('dangerZone')}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{t('deleteAccount')}</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{t('deleteYourAccount')}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {t('deleteDescription')}
                </p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex h-[45px] shrink-0 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-5 text-sm font-semibold text-destructive transition hover:border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                  {t('deleteAccount')}
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingAccount}
                    className="h-[45px] rounded-xl border border-border bg-background px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="inline-flex h-[45px] items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-70"
                  >
                    {isDeletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {isDeletingAccount ? t('deleting') : t('confirmDelete')}
                  </button>
                </div>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-destructive">
                  <XCircle size={16} />
                  {t('deleteWarning')}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
