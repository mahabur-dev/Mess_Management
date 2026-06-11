'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { Bell, Eye, EyeOff, Upload } from 'lucide-react'
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

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">

          {/* ── Profile Section ── */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Profile Information</h2>

            <div className="space-y-4">

              {/* Avatar */}
              <div>
                <label className="text-sm font-medium text-foreground">Profile Picture</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-muted">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground text-center">No image</span>
                      </div>
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
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Upload size={16} />
                      Choose Image
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF (max 5MB)</p>
                    {avatarFile && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              {/* Email — read only */}
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground outline-none cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              {/* Role — read only */}
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground outline-none cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Role cannot be changed</p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoadingProfile}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>

          {/* ── Security Section ── */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Security</h2>

            <div className="space-y-4">

              {/* Current password */}
              <div>
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <div className="mt-2 relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, old: !prev.old }))}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="mt-2 relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                  <p className="text-xs text-destructive mt-1">At least 6 characters required</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="mt-2 relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                    }
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleChangePassword}
                  disabled={isLoadingPassword}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isLoadingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </Card>

          {/* ── Notifications Section ── */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Notifications</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    emailNotifications ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      emailNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive instant alerts</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    pushNotifications ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      pushNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <Bell size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">Smart Notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified about important updates and reminders
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Danger Zone ── */}
          <Card className="p-6 border border-destructive/30 bg-destructive/5">
            <h2 className="text-lg font-semibold text-destructive mb-6">Danger Zone</h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                </div>
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border-destructive text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    Delete
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeletingAccount}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                  </div>
                )}
              </div>

              {showDeleteConfirm && (
                <p className="text-sm text-destructive font-medium border border-destructive/30 rounded-lg px-4 py-3 bg-destructive/10">
                  ⚠ Are you sure? This will permanently delete your account and cannot be undone.
                </p>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}