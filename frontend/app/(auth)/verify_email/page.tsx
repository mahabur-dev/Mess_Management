'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { MailCheck, RotateCcw } from 'lucide-react'

import {
  AuthInfoPanel,
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
import {
  localizedErrorMessage,
  useLocale,
  useLocaleFormatters,
  useTranslations,
  type MessageKey,
} from '@/lib/i18n'

type VerifyEmailValidationKey = Extract<
  MessageKey<'auth'>,
  'validation.registrationFirst' | 'validation.completeCode'
>
type VerifyEmailSuccessKey = Extract<
  MessageKey<'auth'>,
  'verifyEmail.success' | 'verifyEmail.resendSuccess'
>
type RequestFailure = { cause: unknown; context: 'verify' | 'resend' }

export default function VerifyEmailPage() {
  const navigateAfter = useDelayedNavigation()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const auth = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const { remainingSeconds, startCooldown, clearCooldown } = useResendCooldown('registrationResendAt')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [validationKey, setValidationKey] = useState<VerifyEmailValidationKey | null>(null)
  const [successKey, setSuccessKey] = useState<VerifyEmailSuccessKey | null>(null)
  const [requestFailure, setRequestFailure] = useState<RequestFailure | null>(null)

  useEffect(() => {
    setEmail(sessionStorage.getItem('registrationEmail') || '')
  }, [])

  const clearFeedback = () => {
    setValidationKey(null)
    setSuccessKey(null)
    setRequestFailure(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    clearFeedback()

    if (!email) {
      setValidationKey('validation.registrationFirst')
      return
    }
    if (!/^\d{6}$/.test(otp)) {
      setValidationKey('validation.completeCode')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.verifyEmail(email, otp)
      sessionStorage.removeItem('registrationEmail')
      clearCooldown()
      setSuccessKey('verifyEmail.success')
      navigateAfter(`/login?verified=1&email=${encodeURIComponent(email)}`, 900, 'replace')
    } catch (error) {
      setRequestFailure({ cause: error, context: 'verify' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || remainingSeconds > 0) return
    clearFeedback()
    setIsResending(true)

    try {
      const result = await apiClient.resendEmailVerification(email)
      startCooldown(result.data.resendAvailableInSeconds)
      setOtp('')
      setSuccessKey('verifyEmail.resendSuccess')
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

  const description = email
    ? auth('verifyEmail.description', { email })
    : auth('verifyEmail.descriptionMissing')
  const resendLabel = remainingSeconds > 0
    ? auth('verifyEmail.resendIn', { seconds: format.number(remainingSeconds) })
    : auth('verifyEmail.resend')

  return (
    <AuthShell
      title={auth('verifyEmail.title')}
      description={description}
      footer={
        <>
          <Link href="/register" className={`text-sm ${authLinkClass}`}>
            {auth('links.differentEmail')}
          </Link>
          <div>
            <Link href="/login" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-[var(--brand)]">
              {auth('links.alreadyVerified')} <span className={authLinkClass}>{auth('links.signIn')}</span>
            </Link>
          </div>
        </>
      }
    >
      {successKey ? <AuthMessage success>{auth(successKey)}</AuthMessage> : null}
      {validationKey === 'validation.registrationFirst' ? <AuthMessage>{auth(validationKey)}</AuthMessage> : null}
      {requestFailure ? (
        <AuthMessage>
          {localizedErrorMessage(
            requestFailure.cause,
            locale,
            auth(requestFailure.context === 'resend' ? 'verifyEmail.resendError' : 'verifyEmail.error'),
          )}
        </AuthMessage>
      ) : null}

      <div className="mb-5">
        <AuthInfoPanel icon={MailCheck}>{auth('verifyEmail.securityNotice')}</AuthInfoPanel>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthOtpField
          id="email-verification-code"
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
          label={auth('verifyEmail.submit')}
          pendingLabel={auth('verifyEmail.submitting')}
          pending={isSubmitting}
          disabled={!email || Boolean(successKey)}
        />
      </form>

      <AuthSecondaryButton
        label={resendLabel}
        pendingLabel={auth('verifyEmail.resending')}
        pending={isResending}
        disabled={remainingSeconds > 0 || !email || Boolean(successKey)}
        onClick={() => void handleResend()}
        icon={RotateCcw}
        className="mt-4"
      />
    </AuthShell>
  )
}
