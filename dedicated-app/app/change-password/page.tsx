'use client'

import { useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

export default function ChangePasswordPage() {
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const profile = useTranslations('profile')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function handleChangePassword() {
    setMessage(null)

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ tone: 'error', text: profile('allPasswordFieldsRequired') })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'error', text: profile('newPasswordMismatch') })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ tone: 'error', text: profile('newPasswordTooShort') })
      return
    }

    setBusy(true)
    try {
      await api.changePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ tone: 'success', text: profile('passwordUpdated') })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: localizedErrorMessage(error, locale),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={profile('changePassword')} subtitle={profile('profileSecurityDescription')} backHref="/settings" />

      <div className="screen space-y-4">
        <section className="ui-card">
          <div className="flex items-center gap-3">
            <div className="ui-icon-tile ui-icon-tile--lg bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="ui-body font-semibold">{profile('security')}</div>
              <div className="ui-caption mt-0.5">{profile('strongPassword')}</div>
            </div>
          </div>
        </section>

        <section className="ui-card space-y-4">
          <h2 className="ui-section-title">{auth('password')}</h2>

          <TextField
            label={profile('oldPassword')}
            value={oldPassword}
            onChange={setOldPassword}
            placeholder={profile('currentPassword')}
            type="password"
          />

          <TextField
            label={auth('newPassword')}
            value={newPassword}
            onChange={setNewPassword}
            placeholder={profile('atLeastSixCharacters')}
            type="password"
          />

          <TextField
            label={auth('confirmNewPassword')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={profile('reenterNewPassword')}
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
            {profile('updatePassword')}
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}
