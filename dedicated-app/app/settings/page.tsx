'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SubmitButton, TextField, ToggleField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

type FormState = {
  fullName: string
  email: string
  phoneNumber: string
  country: string
  city: string
  address: string
  dateOfBirth: string
  stripeAccountId: string
  verifiedForget: boolean
}

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '' })
  const [form, setForm] = useState<FormState>({
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phoneNumber: user?.phone ?? '',
    country: '',
    city: '',
    address: '',
    dateOfBirth: '',
    stripeAccountId: '',
    verifiedForget: false,
  })

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      fullName: user.name ?? prev.fullName,
      email: user.email ?? prev.email,
      phoneNumber: user.phone ?? prev.phoneNumber,
    }))
  }, [user])

  async function handleSave() {
    setMessage('')
    setBusy(true)
    try {
      const data = new FormData()
      data.append('fullName', form.fullName)
      data.append('email', form.email)
      if (form.phoneNumber) data.append('phoneNumber', form.phoneNumber)
      if (form.country) data.append('country', form.country)
      if (form.city) data.append('city', form.city)
      if (form.address) data.append('address', form.address)
      if (form.dateOfBirth) data.append('dateOfBirth', form.dateOfBirth)
      if (form.stripeAccountId) data.append('stripeAccountId', form.stripeAccountId)
      data.append('verifiedForget', String(form.verifiedForget))
      if (profileImage) data.append('profileImage', profileImage)

      await api.updateProfile(data)
      await refresh()
      setMessage('Profile updated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile.')
    } finally {
      setBusy(false)
    }
  }

  async function handleChangePassword() {
    setPasswordMessage('')
    if (!password.oldPassword || !password.newPassword) return setPasswordMessage('Both password fields are required.')
    try {
      await api.changePassword(password.oldPassword, password.newPassword)
      setPassword({ oldPassword: '', newPassword: '' })
      setPasswordMessage('Password updated successfully.')
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Failed to change password.')
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Settings" subtitle="Profile and security" backHref="/more" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <div className="section-title">Profile</div>
          <TextField label="Full Name" value={form.fullName} onChange={(fullName) => setForm((prev) => ({ ...prev, fullName }))} placeholder="Manager Name" />
          <TextField label="Email" value={form.email} onChange={(email) => setForm((prev) => ({ ...prev, email }))} placeholder="manager@example.com" />
          <TextField label="Phone Number" value={form.phoneNumber} onChange={(phoneNumber) => setForm((prev) => ({ ...prev, phoneNumber }))} placeholder="017xxxxxxxx" />
          <TextField label="Country" value={form.country} onChange={(country) => setForm((prev) => ({ ...prev, country }))} placeholder="Bangladesh" />
          <TextField label="City" value={form.city} onChange={(city) => setForm((prev) => ({ ...prev, city }))} placeholder="Dhaka" />
          <TextField label="Address" value={form.address} onChange={(address) => setForm((prev) => ({ ...prev, address }))} placeholder="House / Road / Area" />
          <TextField label="Date of Birth" value={form.dateOfBirth} onChange={(dateOfBirth) => setForm((prev) => ({ ...prev, dateOfBirth }))} type="date" />
          <TextField label="Stripe Account ID" value={form.stripeAccountId} onChange={(stripeAccountId) => setForm((prev) => ({ ...prev, stripeAccountId }))} placeholder="acct_..." />
          <ToggleField label="Verified Forget" hint="Backend boolean flag" checked={form.verifiedForget} onChange={(verifiedForget) => setForm((prev) => ({ ...prev, verifiedForget }))} />
          <FieldCard label="Profile Image" hint="Optional">
            <input className="field py-3" type="file" accept="image/*" onChange={(event) => setProfileImage(event.target.files?.[0] ?? null)} />
          </FieldCard>
          {message ? <div className="rounded-2xl border border-[#cfe3ff] bg-[#e7f1ff] px-4 py-3 text-sm font-semibold text-[#0f7e86]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSave}>
            Save Profile
          </SubmitButton>
        </div>

        <div className="glass rounded-[28px] p-4 space-y-4">
          <div className="section-title">Security</div>
          <TextField label="Old Password" value={password.oldPassword} onChange={(oldPassword) => setPassword((prev) => ({ ...prev, oldPassword }))} placeholder="********" />
          <TextField label="New Password" value={password.newPassword} onChange={(newPassword) => setPassword((prev) => ({ ...prev, newPassword }))} placeholder="********" />
          {passwordMessage ? <div className="rounded-2xl border border-[#cfe3ff] bg-[#e7f1ff] px-4 py-3 text-sm font-semibold text-[#0f7e86]">{passwordMessage}</div> : null}
          <button className="primary-btn flex w-full items-center justify-center gap-2" type="button" onClick={handleChangePassword}>
            <ShieldCheck size={18} /> Change Password
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
