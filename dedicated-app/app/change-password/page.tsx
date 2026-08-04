'use client'

import { useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function handleChangePassword() {
    setMessage(null)

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ tone: 'error', text: 'All password fields are required.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'error', text: 'New password and confirmation do not match.' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ tone: 'error', text: 'New password must be at least 6 characters.' })
      return
    }

    setBusy(true)
    try {
      await api.changePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ tone: 'success', text: 'Password updated successfully.' })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to change password.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Change Password" subtitle="Update your account password" backHref="/settings" />

      <div className="screen space-y-4">
        <section className="ui-card">
          <div className="flex items-center gap-3">
            <div className="ui-icon-tile ui-icon-tile--lg bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="ui-body font-bold">Security</div>
              <div className="ui-caption mt-0.5">Choose a strong, unique password</div>
            </div>
          </div>
        </section>

        <section className="ui-card space-y-4">
          <h2 className="ui-section-title">Password</h2>

          <TextField
            label="Old Password"
            value={oldPassword}
            onChange={setOldPassword}
            placeholder="Current password"
            type="password"
          />

          <TextField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 6 characters"
            type="password"
          />

          <TextField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password"
            type="password"
          />

          {message ? (
            <div
              className={`ui-notice ${message.tone === 'success' ? 'ui-notice--success' : 'ui-notice--danger'}`}
              role="status"
            >
              {message.text}
            </div>
          ) : null}

          <SubmitButton busy={busy} onClick={() => void handleChangePassword()}>
            <KeyRound size={17} aria-hidden="true" />
            Update Password
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}