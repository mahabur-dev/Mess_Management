'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MailCheck, RotateCcw } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ApiError, apiClient } from '@/lib/api-client'
import {
  AuthMessage,
  AuthShell,
  authLinkClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth-ui'

function getRemainingSeconds() {
  const resendAt = Number(sessionStorage.getItem('registrationResendAt') || 0)
  return Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
}

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    setEmail(sessionStorage.getItem('registrationEmail') || '')
    setRemainingSeconds(getRemainingSeconds())
    const timer = window.setInterval(() => setRemainingSeconds(getRemainingSeconds()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setIsSuccess(false)
    if (!email) {
      setMessage('Start registration first so we know which email to verify.')
      return
    }
    if (!/^\d{6}$/.test(otp)) {
      setMessage('Enter the complete 6-digit verification code.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await apiClient.verifyEmail(email, otp)
      sessionStorage.removeItem('registrationEmail')
      sessionStorage.removeItem('registrationResendAt')
      setIsSuccess(true)
      setMessage(result.message || 'Email verified. You can now sign in.')
      window.setTimeout(() => router.replace(`/login?verified=1&email=${encodeURIComponent(email)}`), 900)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Email verification failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || remainingSeconds > 0) return
    setMessage('')
    setIsSuccess(false)
    setIsResending(true)
    try {
      const result = await apiClient.resendEmailVerification(email)
      sessionStorage.setItem(
        'registrationResendAt',
        String(Date.now() + result.data.resendAvailableInSeconds * 1000),
      )
      setRemainingSeconds(result.data.resendAvailableInSeconds)
      setOtp('')
      setIsSuccess(true)
      setMessage(result.message || 'A new verification code was sent.')
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not resend the verification code.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      description={email ? `We sent a 6-digit code to ${email}.` : 'Complete registration to receive a verification code.'}
      footer={
        <>
          <Link href="/register" className={`text-sm ${authLinkClass}`}>
            Use a different email
          </Link>
          <div>
            <Link href="/login" className="text-sm font-semibold text-muted-foreground transition hover:text-[var(--brand)]">
              Already verified? <span className={authLinkClass}>Sign in</span>
            </Link>
          </div>
        </>
      }
    >
      {message && <AuthMessage success={isSuccess}>{message}</AuthMessage>}

      <div className="mb-5 flex items-start gap-3 rounded-md border border-[#d8e8e7] bg-[#f7fcfb] p-4">
        <MailCheck size={18} className="mt-0.5 shrink-0 text-[var(--brand)]" />
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          Your account stays locked until this email is verified. The code expires after 10 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-3 block text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Verification Code
          </label>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            inputMode="numeric"
            autoFocus
            containerClassName="justify-center gap-2"
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-11 rounded-md border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-base font-semibold text-foreground data-[active=true]:border-[var(--brand)] data-[active=true]:ring-4 data-[active=true]:ring-[var(--brand-ring)]"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button type="submit" disabled={isSubmitting || !email} className={authPrimaryButtonClass}>
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>

      <button
        type="button"
        disabled={isResending || remainingSeconds > 0 || !email}
        onClick={() => void handleResend()}
        className={`mt-4 ${authSecondaryButtonClass}`}
      >
        <RotateCcw size={16} />
        {isResending
          ? 'Sending...'
          : remainingSeconds > 0
            ? `Resend in ${remainingSeconds}s`
            : 'Resend Code'}
      </button>
    </AuthShell>
  )
}
