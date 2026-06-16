'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { Bell, Eye, EyeOff, Upload, User, Lock, ShieldAlert, Camera, Save, KeyRound, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { toast } from '@/hooks/use-toast'

// ── API base URL ──────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

    console.log(token);
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

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']

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
      toast({ title: 'Error', description: 'Image must be under 5MB', variant: 'destructive' })
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
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
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

      toast({ title: 'Success', description: 'Profile updated successfully' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword) {
      toast({ title: 'Error', description: 'Current password is required', variant: 'destructive' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters', variant: 'destructive' })
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      toast({ title: 'Error', description: 'New password must differ from current password', variant: 'destructive' })
      return
    }

    try {
      setIsLoadingPassword(true)
      await apiChangePassword(passwordData.oldPassword, passwordData.newPassword)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast({ title: 'Success', description: 'Password changed successfully' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to change password',
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
      toast({ title: 'Account deleted', description: 'Your account has been permanently deleted.' })
      // redirect to login or call logout from auth context
      window.location.href = '/login'
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete account',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }

  const avatarBg = avatarColor(user?.name || 'User')

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-7">

        {/* ── Profile Section ── */}
        <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#58d68d]/15 shadow-sm">
                <User size={22} className="text-[#2f80ed]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Account</p>
                <h2 className="mt-1 text-lg font-black text-[#172554]">Profile Information</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Profile Picture
                </label>
                <div className="flex items-center gap-5">
                  <div
                    className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 text-3xl font-black shadow-inner"
                    style={{
                      backgroundColor: `${avatarBg}18`,
                      borderColor: `${avatarBg}55`,
                      color: avatarBg,
                    }}
                  >
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile preview"
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
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8e6f8] bg-white px-4 text-xs font-bold text-[#6b7a99] transition hover:border-[#a9ccfb] hover:bg-[#f8faff]"
                    >
                      <Camera size={15} className="text-[#2f80ed]" />
                      Choose Image
                    </button>
                    <p className="text-[10px] font-semibold text-[#8a9bb5]">JPG, PNG or GIF (max 5MB)</p>
                    {avatarFile && (
                      <p className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 size={13} />
                        {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>

              {/* Email — read only */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-[48px] w-full rounded-xl border border-[#e6ebf4] bg-[#f8faff] px-4 text-sm font-semibold text-[#6b7a99] outline-none cursor-not-allowed"
                />
                <p className="mt-1.5 text-[11px] font-semibold text-[#8a9bb5]">Email cannot be changed</p>
              </div>

              {/* Role — read only */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Role
                </label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="h-[48px] w-full rounded-xl border border-[#e6ebf4] bg-[#f8faff] px-4 text-sm font-semibold text-[#6b7a99] outline-none cursor-not-allowed"
                />
                <p className="mt-1.5 text-[11px] font-semibold text-[#8a9bb5]">Role cannot be changed</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoadingProfile}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
                >
                  {isLoadingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Security Section ── */}
        <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 shadow-sm">
                <Lock size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">Security</p>
                <h2 className="mt-1 text-lg font-black text-[#172554]">Change Password</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              {/* Current password */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))
                    }
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 pr-12 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, old: !prev.old }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5] transition hover:text-[#6b7a99]"
                  >
                    {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 pr-12 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5] transition hover:text-[#6b7a99]"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-500">
                    <XCircle size={13} />
                    At least 6 characters required
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 pr-12 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5] transition hover:text-[#6b7a99]"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-500">
                      <XCircle size={13} />
                      Passwords do not match
                    </p>
                  )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoadingPassword}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-black text-white shadow-[0_12px_28px_rgba(245,158,11,0.25)] transition hover:shadow-[0_16px_35px_rgba(245,158,11,0.32)] disabled:opacity-70"
                >
                  {isLoadingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {isLoadingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notifications Section ── */}
        <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 shadow-sm">
                <Bell size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-600">Preferences</p>
                <h2 className="mt-1 text-lg font-black text-[#172554]">Notifications</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4 transition hover:border-[#a9ccfb]">
                <div>
                  <p className="text-sm font-bold text-[#172554]">Email Notifications</p>
                  <p className="text-xs font-semibold text-[#6b7a99] mt-0.5">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                    emailNotifications ? 'bg-[#2f80ed]' : 'bg-[#e6ebf4]'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition ${
                      emailNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4 transition hover:border-[#a9ccfb]">
                <div>
                  <p className="text-sm font-bold text-[#172554]">Push Notifications</p>
                  <p className="text-xs font-semibold text-[#6b7a99] mt-0.5">Receive instant alerts</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                    pushNotifications ? 'bg-[#2f80ed]' : 'bg-[#e6ebf4]'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition ${
                      pushNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#d8e6f8] bg-gradient-to-r from-[#e7f1ff] to-[#f0fdf4] p-4">
                <Bell size={18} className="shrink-0 text-[#2f80ed] mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#172554]">Smart Notifications</p>
                  <p className="text-xs font-semibold text-[#6b7a99] mt-0.5">
                    Get notified about important updates and reminders
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="overflow-hidden rounded-xl border border-red-200/60 bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="border-b border-red-100 bg-gradient-to-r from-red-50 via-white to-red-50/50 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-rose-100 shadow-sm">
                <ShieldAlert size={22} className="text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500">Danger Zone</p>
                <h2 className="mt-1 text-lg font-black text-[#172554]">Delete Account</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#172554]">Delete Your Account</p>
                <p className="mt-1 text-xs font-semibold text-[#6b7a99]">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex h-[45px] shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-600 transition hover:border-red-300 hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingAccount}
                    className="h-[45px] rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-black text-[#6b7a99] transition hover:bg-[#f8faff] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="inline-flex h-[45px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-5 text-sm font-black text-white shadow-[0_8px_20px_rgba(239,68,68,0.25)] transition hover:shadow-[0_12px_28px_rgba(239,68,68,0.32)] disabled:opacity-70"
                  >
                    {isDeletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-red-600">
                  <XCircle size={16} />
                  ⚠ Are you sure? This will permanently delete your account and cannot be undone.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}