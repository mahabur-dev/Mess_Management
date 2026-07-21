'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { Mail, Phone, RotateCcw, ShieldCheck, User } from 'lucide-react'
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

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function resultMessage(result: { message?: string; data?: { message?: string } }, fallback: string) {
  return result.data?.message || result.message || fallback
}

export function SignupPage() {
  const router = useRouter()
  const { register, isSubmitting } = useAuth()
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
      setError('Password must be at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      await register(form.name, form.email, form.phone, form.password)
      router.push('/')
    } catch (error) {
      setError(messageFrom(error, 'Registration failed. Please try again.'))
    }
  }

  return (
    <AuthShell
      title="Create your account"
      description="Join your mess workspace and manage meals, payments, and notices from your phone."
      footer={<AuthFooterLink text="Already have an account?" href="/login" action="Sign in" />}
    >
      {error ? <AuthMessage>{error}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Full name"
          icon={User}
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
        />

        <AuthField
          label="Email address"
          icon={Mail}
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthField
          label="Phone number"
          icon={Phone}
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          type="tel"
          placeholder="01700-000000"
          autoComplete="tel"
        />

        <AuthPasswordField
          label="Password"
          value={form.password}
          onChange={(value) => update('password', value)}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder="Minimum 6 characters"
          autoComplete="new-password"
        />

        <AuthPasswordField
          label="Confirm password"
          value={form.confirmPassword}
          onChange={(value) => update('confirmPassword', value)}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />

        <div className="rounded-2xl border border-[#cfeeed] bg-[#f7fcfb] px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#008d8c]" />
            <p className="text-xs font-semibold leading-relaxed text-[#65838b]">
              New accounts start as members. Your mess manager can approve access from the dashboard.
            </p>
          </div>
        </div>

        <AuthSubmitButton busy={isSubmitting} busyLabel="Creating account...">
          Create Account
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const router = useRouter()
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
    try {
      const result = await api.forgotPassword(normalizedEmail)
      sessionStorage.setItem('resetEmail', normalizedEmail)
      setSuccess(true)
      setMessage(resultMessage(result, 'OTP sent to your email.'))
      window.setTimeout(() => router.push('/verify_otp'), 700)
    } catch (error) {
      setMessage(messageFrom(error, 'Failed to send OTP.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email address and we will send a verification code."
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      {message ? <AuthMessage success={success}>{message}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email address"
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthSubmitButton busy={busy} busyLabel="Sending OTP...">
          Send OTP
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}

export function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSuccess(false)

    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      setMessage('Please request an OTP with your email first.')
      return
    }

    if (otp.trim().length !== 6) {
      setMessage('Please enter the 6-digit verification code.')
      return
    }

    setBusy(true)
    try {
      const result = await api.verifyOtp(email, otp.trim())
      sessionStorage.setItem('otpVerified', 'true')
      setSuccess(true)
      setMessage(resultMessage(result, 'OTP verified successfully.'))
      window.setTimeout(() => router.push('/reset_password'), 700)
    } catch (error) {
      setMessage(messageFrom(error, 'OTP verification failed.'))
    } finally {
      setBusy(false)
    }
  }

  async function resendOtp() {
    const email = sessionStorage.getItem('resetEmail')
    setMessage('')
    setSuccess(false)

    if (!email) {
      setMessage('Please request an OTP with your email first.')
      return
    }

    setResending(true)
    try {
      const result = await api.forgotPassword(email)
      setOtp('')
      setSuccess(true)
      setMessage(resultMessage(result, 'A new OTP has been sent to your email.'))
    } catch (error) {
      setMessage(messageFrom(error, 'Failed to resend OTP.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify OTP"
      description="Enter the 6-digit code sent to your email address."
      footer={
        <div className="space-y-2">
          <Link href="/forget_password" className={authLinkClass}>
            Back to email
          </Link>
          <div>
            <Link href="/login" className="font-semibold text-[#65838b] transition hover:text-[#008d8c]">
              Remember your password? <span className={authLinkClass}>Sign in</span>
            </Link>
          </div>
        </div>
      }
    >
      {message ? <AuthMessage success={success}>{message}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <div className="mb-2 text-center text-sm font-bold text-[#123748]">Verification code</div>
          <input
            className="field h-14 rounded-2xl bg-white px-4 text-center text-xl font-black tracking-[0.24em]"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </label>

        <AuthSubmitButton busy={busy} busyLabel="Verifying...">
          Verify Code
        </AuthSubmitButton>
      </form>

      <button
        type="button"
        onClick={() => void resendOtp()}
        disabled={resending}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#cfeeed] bg-white text-sm font-black text-[#008d8c] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <RotateCcw size={16} />
        {resending ? 'Resending...' : 'Resend OTP'}
      </button>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const router = useRouter()
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
      setMessage('Please verify your OTP before resetting password.')
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const result = await api.resetPassword(email, password)
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('otpVerified')
      setSuccess(true)
      setMessage(resultMessage(result, 'Password reset successfully.'))
      window.setTimeout(() => router.push('/login'), 800)
    } catch (error) {
      setMessage(messageFrom(error, 'Password reset failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Create a new password to secure your Mess Management account."
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      {message ? <AuthMessage success={success}>{message}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthPasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder="Enter new password"
          autoComplete="new-password"
        />

        <AuthPasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />

        <AuthSubmitButton busy={busy} busyLabel="Resetting...">
          Reset Password
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
