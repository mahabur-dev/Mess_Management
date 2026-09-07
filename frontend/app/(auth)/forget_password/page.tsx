'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'

import {
  AuthMessage,
  AuthShell,
  AuthSubmitButton,
  AuthTextField,
  authLinkClass,
} from '@/components/auth-ui'
import { useDelayedNavigation } from '@/hooks/use-delayed-navigation'
import { useResendCooldown } from '@/hooks/use-resend-cooldown'
import { apiClient } from '@/lib/api-client'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

export default function ForgetPassword() {
  const navigateAfter = useDelayedNavigation()
  const { startCooldown } = useResendCooldown('resetResendAt')
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState<unknown>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSuccess(false)
    setIsSubmitting(true)
    setRequestError(null)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response = await apiClient.forgotPassword(normalizedEmail)
      setIsSuccess(true)
      sessionStorage.setItem('resetEmail', normalizedEmail)
      startCooldown(response.data.resendAvailableInSeconds)
      navigateAfter('/verify_otp', 800)
    } catch (error) {
      setRequestError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={auth('forgot.title')}
      description={auth('forgot.description')}
      footer={
        <Link href="/login" className={`text-sm ${authLinkClass}`}>
          {auth('links.backToSignIn')}
        </Link>
      }
    >
      {isSuccess ? <AuthMessage success>{auth('forgot.success')}</AuthMessage> : null}
      {requestError ? (
        <AuthMessage>{localizedErrorMessage(requestError, locale, auth('forgot.error'))}</AuthMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthTextField
          id="forgot-email"
          label={auth('fields.email')}
          icon={Mail}
          type="email"
          placeholder={auth('placeholders.email')}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setRequestError(null)
            setIsSuccess(false)
          }}
          autoComplete="email"
          maxLength={255}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.email') }),
            invalid: auth('validation.invalidEmail'),
          }}
          required
        />

        <AuthSubmitButton
          label={auth('forgot.submit')}
          pendingLabel={auth('forgot.submitting')}
          pending={isSubmitting}
        />
      </form>
    </AuthShell>
  )
}
