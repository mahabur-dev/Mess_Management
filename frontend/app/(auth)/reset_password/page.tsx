'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'

import {
  AuthMessage,
  AuthPasswordField,
  AuthShell,
  AuthSubmitButton,
  authLinkClass,
} from '@/components/auth-ui'
import { useDelayedNavigation } from '@/hooks/use-delayed-navigation'
import { apiClient } from '@/lib/api-client'
import { localizedErrorMessage, useLocale, useTranslations, type MessageKey } from '@/lib/i18n'

type ResetValidationKey = Extract<
  MessageKey<'auth'>,
  'validation.verifyOtpFirst' | 'validation.passwordMinimum' | 'validation.passwordsMismatch'
>

export default function ResetPassword() {
  const navigateAfter = useDelayedNavigation()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [validationKey, setValidationKey] = useState<ResetValidationKey | null>(null)
  const [requestError, setRequestError] = useState<unknown>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setValidationKey(null)
    setRequestError(null)
    setIsSuccess(false)

    const email = sessionStorage.getItem('resetEmail')
    const resetToken = sessionStorage.getItem('passwordResetToken')

    if (!email || !resetToken) {
      setValidationKey('validation.verifyOtpFirst')
      return
    }
    if (password.length < 6) {
      setValidationKey('validation.passwordMinimum')
      return
    }
    if (password !== confirmPassword) {
      setValidationKey('validation.passwordsMismatch')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.resetPassword(email, resetToken, password)
      setIsSuccess(true)
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('passwordResetToken')
      sessionStorage.removeItem('resetResendAt')
      navigateAfter('/login', 900, 'replace')
    } catch (error) {
      setRequestError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const flowError = validationKey === 'validation.verifyOtpFirst' ? auth(validationKey) : ''
  const passwordError = validationKey === 'validation.passwordMinimum'
    ? auth(validationKey, { count: 6 })
    : undefined
  const confirmationError = validationKey === 'validation.passwordsMismatch'
    ? auth(validationKey)
    : undefined

  return (
    <AuthShell
      title={auth('reset.title')}
      description={auth('reset.description')}
      footer={
        <Link href="/login" className={`text-sm ${authLinkClass}`}>
          {auth('links.backToSignIn')}
        </Link>
      }
    >
      {isSuccess ? <AuthMessage success>{auth('reset.success')}</AuthMessage> : null}
      {flowError ? <AuthMessage>{flowError}</AuthMessage> : null}
      {requestError ? (
        <AuthMessage>{localizedErrorMessage(requestError, locale, auth('reset.error'))}</AuthMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthPasswordField
          id="reset-password"
          label={auth('fields.newPassword')}
          placeholder={auth('placeholders.newPassword')}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setValidationKey(null)
            setRequestError(null)
          }}
          autoComplete="new-password"
          showLabel={auth('visibility.showPassword')}
          hideLabel={auth('visibility.hidePassword')}
          minLength={6}
          maxLength={128}
          error={passwordError}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.newPassword') }),
            tooShort: auth('validation.passwordMinimum', { count: 6 }),
          }}
          required
        />

        <AuthPasswordField
          id="reset-confirm-password"
          label={auth('fields.confirmPassword')}
          placeholder={auth('placeholders.confirmNewPassword')}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setValidationKey(null)
            setRequestError(null)
          }}
          autoComplete="new-password"
          showLabel={auth('visibility.showConfirmation')}
          hideLabel={auth('visibility.hideConfirmation')}
          minLength={6}
          maxLength={128}
          error={confirmationError}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.confirmPassword') }),
            tooShort: auth('validation.passwordMinimum', { count: 6 }),
          }}
          required
        />

        <AuthSubmitButton
          label={auth('reset.submit')}
          pendingLabel={auth('reset.submitting')}
          pending={isSubmitting}
          disabled={isSuccess}
        />
      </form>
    </AuthShell>
  )
}
