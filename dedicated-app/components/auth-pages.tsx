'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, type FormEvent, useState, type ClipboardEvent, type KeyboardEvent, } from 'react'
import { Mail, Phone, RotateCcw, User, UserRound } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { api } from '@/lib/api'
import {
  AuthField,
  AuthFooterLink,
  AuthMessage,
  AuthPasswordField,
  AuthShell,
  AuthSubmitButton,
  authLinkClass,
} from '@/components/auth-ui'
import { Button } from '@/components/ui/button'
import { localizedErrorMessage, useLocale, useTranslations, type Locale } from '@/lib/i18n'
function messageFrom(error: unknown, fallback: string, locale: Locale) {
  return error ? localizedErrorMessage(error, locale) : fallback
}

function resultMessage(_result: { message?: string; data?: { message?: string } }, fallback: string) {
  return fallback
}

export function SignupPage() {
  const { register, isSubmitting } = useAuth()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError(auth('passwordMinError'))
      return
    }

    if (form.password !== form.confirmPassword) {
      setError(auth('passwordMismatch'))
      return
    }

    try {
      await register(form.name, form.email, form.phone, form.password)
    } catch (error) {
      setError(messageFrom(error, auth('registrationFailed'), locale))
    }
  }

  return (
    <AuthShell
      title={auth('createAccount')}
      variant="reference"
      icon={UserRound}
      description={auth('createAccountDescription')}
      footer={<AuthFooterLink text={auth('alreadyHaveAccount')} href="/login" action={auth('signIn')} />}
    >
      {error ? <AuthMessage>{error}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label={auth('fullName')}
          icon={User}
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder={auth('yourName')}
          autoComplete="name"
          required
        />

        <AuthField
          label={auth('emailAddress')}
          icon={Mail}
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthField
          label={auth('phoneNumber')}
          icon={Phone}
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          type="tel"
          placeholder="01700-000000"
          autoComplete="tel"
        />

        <AuthPasswordField
          label={auth('password')}
          value={form.password}
          onChange={(value) => update('password', value)}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder={auth('minimumPassword')}
          autoComplete="new-password"
        />

        <AuthPasswordField
          label={auth('confirmPassword')}
          value={form.confirmPassword}
          onChange={(value) => update('confirmPassword', value)}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          placeholder={auth('confirmYourPassword')}
          autoComplete="new-password"
        />

        <AuthSubmitButton busy={isSubmitting} busyLabel={auth('creatingAccount')}>
          {auth('createAccount')}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setSuccess(false)
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setMessage(auth('emailRequired'))
      setBusy(false)
      return
    }

    try {
      const result = await api.forgotPassword(normalizedEmail)
      sessionStorage.setItem('resetEmail', normalizedEmail)
      sessionStorage.removeItem('otpVerified')
      setSuccess(true)
      setMessage(resultMessage(result, auth('otpSent')))
      window.setTimeout(() => router.push('/verify_otp'), 700)
    } catch (error) {
      setMessage(messageFrom(error, auth('sendOtpFailed'), locale))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={auth('forgotTitle')}
      variant="reference"
      description={auth('forgotDescription')}
      footer={
        <Link href="/login" className={authLinkClass}>
          {auth('backToSignIn')}
        </Link>
      }
    >
      {message ? <AuthMessage success={success}>{message}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label={auth('emailAddress')}
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthSubmitButton busy={busy} busyLabel={auth('sendingOtp')}>
          {auth('sendOtp')}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}

export function VerifyOtpPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const auth = useTranslations('auth')

  const OTP_LENGTH = 6

  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill('')
  )
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const otp = otpDigits.join('')

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)

    setOtpDigits((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === 'Backspace' &&
      !otpDigits[index] &&
      index > 0
    ) {
      otpRefs.current[index - 1]?.focus()
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      otpRefs.current[index - 1]?.focus()
    }

    if (
      event.key === 'ArrowRight' &&
      index < OTP_LENGTH - 1
    ) {
      event.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpPaste(
    event: ClipboardEvent<HTMLDivElement>
  ) {
    event.preventDefault()

    const pastedOtp = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)

    if (!pastedOtp) return

    const nextDigits = Array(OTP_LENGTH).fill('')

    pastedOtp.split('').forEach((digit, index) => {
      nextDigits[index] = digit
    })

    setOtpDigits(nextDigits)

    const focusIndex = Math.min(
      pastedOtp.length,
      OTP_LENGTH - 1
    )

    otpRefs.current[focusIndex]?.focus()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSuccess(false)

    const email = sessionStorage.getItem('resetEmail')

    if (!email) {
      setMessage(auth('requestOtpFirst'))
      return
    }

    if (otp.length !== OTP_LENGTH) {
      setMessage(auth('enterSixDigitCode'))
      otpRefs.current[otpDigits.findIndex((digit) => !digit)]?.focus()
      return
    }

    setBusy(true)

    try {
      const result = await api.verifyOtp(email, otp)

      sessionStorage.setItem('otpVerified', 'true')
      setSuccess(true)
      setMessage(
        resultMessage(result, auth('otpVerified'))
      )

      window.setTimeout(() => {
        router.push('/reset_password')
      }, 700)
    } catch (error) {
      setMessage(
        messageFrom(error, auth('otpVerificationFailed'), locale)
      )
    } finally {
      setBusy(false)
    }
  }

  async function resendOtp() {
    const email = sessionStorage.getItem('resetEmail')

    setMessage('')
    setSuccess(false)

    if (!email) {
      setMessage(auth('requestOtpFirst'))
      return
    }

    setResending(true)

    try {
      const result = await api.forgotPassword(email)

      setOtpDigits(Array(OTP_LENGTH).fill(''))
      otpRefs.current[0]?.focus()

      setSuccess(true)
      setMessage(
        resultMessage(
          result,
          auth('newOtpSent')
        )
      )
    } catch (error) {
      setMessage(
        messageFrom(error, auth('resendOtpFailed'), locale)
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title={auth('enterOtp')}
      variant="reference"
      description={auth('otpDescription')}
      footer={
        <div className="space-y-2">
          <Link
            href="/forget_password"
            className={authLinkClass}
          >
            {auth('backToEmail')}
          </Link>

          <div>
            <Link
              href="/login"
              className="font-semibold text-[#65838b] transition hover:text-[#008d8c]"
            >
              {auth('rememberPassword')}{' '}
              <span className={authLinkClass}>
                {auth('signIn')}
              </span>
            </Link>
          </div>
        </div>
      }
    >
      {message ? (
        <AuthMessage success={success}>
          {message}
        </AuthMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="block">
          <div className="mb-3 text-center text-label font-semibold text-[#123748]">
            {auth('verificationCode')}
          </div>

          <div
            className="grid grid-cols-6 gap-1.5 min-[360px]:gap-2"
            onPaste={handleOtpPaste}
          >
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpRefs.current[index] = element
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={
                  index === 0 ? 'one-time-code' : 'off'
                }
                maxLength={1}
                value={digit}
                aria-label={auth('otpDigit', { number: index + 1 })}
                onChange={(event) =>
                  handleOtpChange(
                    index,
                    event.target.value
                  )
                }
                onKeyDown={(event) =>
                  handleOtpKeyDown(index, event)
                }
                onFocus={(event) =>
                  event.currentTarget.select()
                }
                className="auth-otp-input
                  min-h-14 min-w-0 w-full
                  rounded-[14px]
                  border border-[#c3e4e4]
                  bg-white
                  text-center text-headline
                  font-semibold text-[#062b35]
                  caret-[#008d8c]
                  outline-none
                  shadow-[0_5px_15px_rgba(0,141,140,0.05)]
                  transition-all duration-200
                  hover:border-[#7bcac8]
                  focus:-translate-y-0.5
                  focus:border-[#008d8c]
                  focus:ring-4
                  focus:ring-[#008d8c]/12
                  min-[360px]:min-h-[60px]
                "
              />
            ))}
          </div>

          <div className="mt-3 text-center text-caption font-medium text-[#789096]">
            {auth('enterEmailCode')}
          </div>
        </div>

        <AuthSubmitButton
          busy={busy}
          busyLabel={auth('verifying')}
        >
          {auth('verifyCode')}
        </AuthSubmitButton>
      </form>

      <Button
        type="button"
        variant="secondary"
        onClick={() => void resendOtp()}
        busy={resending}
        busyLabel={auth('resending')}
        className="mt-4 w-full"
      >
        <RotateCcw size={15} />
        {auth('resendOtp')}
      </Button>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSuccess(false)

    const email = sessionStorage.getItem('resetEmail')
    const otpVerified = sessionStorage.getItem('otpVerified')

    if (!email || otpVerified !== 'true') {
      setMessage(auth('verifyOtpBeforeReset'))
      return
    }

    if (password.length < 6) {
      setMessage(auth('passwordMinError'))
      return
    }

    if (password !== confirmPassword) {
      setMessage(auth('passwordMismatch'))
      return
    }

    setBusy(true)
    try {
      const result = await api.resetPassword(email, password)
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('otpVerified')
      setSuccess(true)
      setMessage(resultMessage(result, auth('passwordResetSuccess')))
      window.setTimeout(() => router.push('/login'), 800)
    } catch (error) {
      setMessage(messageFrom(error, auth('passwordResetFailed'), locale))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={auth('newPasswordTitle')}
      variant="reference"
      description={auth('newPasswordDescription')}
      footer={
        <Link href="/login" className={authLinkClass}>
          {auth('backToSignIn')}
        </Link>
      }
    >
      {message ? <AuthMessage success={success}>{message}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthPasswordField
          label={auth('newPassword')}
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder={auth('enterNewPassword')}
          autoComplete="new-password"
        />

        <AuthPasswordField
          label={auth('confirmPassword')}
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          placeholder={auth('confirmNewPassword')}
          autoComplete="new-password"
        />

        <AuthSubmitButton busy={busy} busyLabel={auth('resetting')}>
          {auth('resetPassword')}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
