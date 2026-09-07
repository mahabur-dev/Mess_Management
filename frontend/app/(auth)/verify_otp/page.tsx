'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'

import {
  AuthMessage,
  AuthOtpField,
  AuthSecondaryButton,
  AuthShell,
  AuthSubmitButton,
  authLinkClass,
} from '@/components/auth-ui'
import { useDelayedNavigation } from '@/hooks/use-delayed-navigation'
import { useResendCooldown } from '@/hooks/use-resend-cooldown'
import { ApiError, apiClient } from '@/lib/api-client'
import { localizedErrorMessage, useLocale, useLocaleFormatters, useTranslations, type MessageKey } from '@/lib/i18n'

type VerifyOtpValidationKey = Extract<
  MessageKey<'auth'>,
  'validation.completeCode' | 'validation.requestOtpFirst'
>
type VerifyOtpSuccessKey = Extract<
  MessageKey<'auth'>,
  'verifyOtp.success' | 'verifyOtp.resendSuccess'
>
type RequestFailure = { cause: unknown; context: 'verify' | 'resend' }

export default function VerifyOtp() {
  const navigateAfter = useDelayedNavigation()
  const { remainingSeconds, startCooldown, clearCooldown } = useResendCooldown('resetResendAt')
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const auth = useTranslations('auth')
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [validationKey, setValidationKey] = useState<VerifyOtpValidationKey | null>(null)
  const [successKey, setSuccessKey] = useState<VerifyOtpSuccessKey | null>(null)
  const [requestFailure, setRequestFailure] = useState<RequestFailure | null>(null)

  const clearFeedback = () => {
    setValidationKey(null)
    setSuccessKey(null)
    setRequestFailure(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    clearFeedback()

    if (!/^\d{6}$/.test(otp)) {
      setValidationKey('validation.completeCode')
      return
    }
    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      setValidationKey('validation.requestOtpFirst')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await apiClient.verifyOtp(email, otp)
      sessionStorage.setItem('passwordResetToken', result.data.resetToken)
      clearCooldown()
      setSuccessKey('verifyOtp.success')
      navigateAfter('/reset_password', 800)
    } catch (error) {
      setRequestFailure({ cause: error, context: 'verify' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    clearFeedback()
    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      setValidationKey('validation.requestOtpFirst')
      return
    }

    setIsResending(true)
    try {
      const response = await apiClient.forgotPassword(email)
      setOtp('')
      startCooldown(response.data.resendAvailableInSeconds)
      setSuccessKey('verifyOtp.resendSuccess')
    } catch (error) {
      const retryAfter = error instanceof ApiError
        ? Number(error.params.retryAfterSeconds)
        : 0
      if (Number.isFinite(retryAfter) && retryAfter > 0) startCooldown(retryAfter)
      setRequestFailure({ cause: error, context: 'resend' })
    } finally {
      setIsResending(false)
    }
  }

  const resendLabel = remainingSeconds > 0
    ? auth('verifyOtp.resendIn', { seconds: format.number(remainingSeconds) })
    : auth('verifyOtp.resend')

  return (
    <AuthShell
      title={auth('verifyOtp.title')}
      description={auth('verifyOtp.description')}
      footer={
        <>
          <Link href="/forget_password" className={`text-sm ${authLinkClass}`}>
            {auth('links.backToEmail')}
          </Link>
          <div>
            <Link href="/login" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-[var(--brand)]">
              {auth('links.rememberPassword')} <span className={authLinkClass}>{auth('links.signIn')}</span>
            </Link>
          </div>
        </>
      }
    >
      {successKey ? <AuthMessage success>{auth(successKey)}</AuthMessage> : null}
      {validationKey === 'validation.requestOtpFirst' ? <AuthMessage>{auth(validationKey)}</AuthMessage> : null}
      {requestFailure ? (
        <AuthMessage>
          {localizedErrorMessage(
            requestFailure.cause,
            locale,
            auth(requestFailure.context === 'resend' ? 'verifyOtp.resendError' : 'verifyOtp.error'),
          )}
        </AuthMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthOtpField
          id="password-reset-code"
          label={auth('fields.verificationCode')}
          value={otp}
          onChange={(value) => {
            setOtp(value)
            setValidationKey(null)
            setRequestFailure(null)
          }}
          autoFocus
          error={validationKey === 'validation.completeCode' ? auth(validationKey) : undefined}
        />

        <AuthSubmitButton
          label={auth('verifyOtp.submit')}
          pendingLabel={auth('verifyOtp.submitting')}
          pending={isSubmitting}
          disabled={Boolean(successKey)}
        />
      </form>

      <AuthSecondaryButton
        label={resendLabel}
        pendingLabel={auth('verifyOtp.resending')}
        pending={isResending}
        disabled={Boolean(successKey) || remainingSeconds > 0}
        onClick={() => void handleResendOtp()}
        icon={RotateCcw}
        className="mt-4"
      />
    </AuthShell>
  )
}
