'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import {
  AuthMessage,
  AuthShell,
  authFieldIconClass,
  authInputWithIconClass,
  authLinkClass,
  authPasswordInputClass,
  authPasswordToggleClass,
  authPrimaryButtonClass,
} from '@/components/auth-ui'

export default function RegisterPage() {
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
  const [showConfirm, setShowConfirm] = useState(false)
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
      const challenge = await register(form.name, form.email, form.phone, form.password)
      sessionStorage.setItem('registrationEmail', challenge.email)
      sessionStorage.setItem(
        'registrationResendAt',
        String(Date.now() + challenge.resendAvailableInSeconds * 1000),
      )
      router.push('/verify_email')
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Registration failed. Please try again.')
    }
  }

  return (
    <AuthShell
      title="Create account"
      description="Create your member profile, then verify your email before signing in."
      maxWidth="max-w-[500px]"
      footer={
        <p className="text-sm font-semibold text-[#64748b]">
          Already have an account?{' '}
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </p>
      }
    >
      {error && <AuthMessage>{error}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Full Name
          </label>
          <div className="relative">
            <User size={16} className={authFieldIconClass} />
            <input
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              className={authInputWithIconClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className={authFieldIconClass} />
            <input
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="contact@example.com"
              autoComplete="email"
              required
              className={authInputWithIconClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={16} className={authFieldIconClass} />
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="01700-000000"
              autoComplete="tel"
              required
              className={authInputWithIconClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className={authFieldIconClass} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="Min 6 chars"
                autoComplete="new-password"
                required
                className={`${authPasswordInputClass} pl-11`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
                className={authPasswordToggleClass}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              Confirm
            </label>
            <div className="relative">
              <Lock size={16} className={authFieldIconClass} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                placeholder="Confirm"
                autoComplete="new-password"
                required
                className={`${authPasswordInputClass} pl-11`}
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                onClick={() => setShowConfirm((current) => !current)}
                className={authPasswordToggleClass}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#d8e8e7] bg-[#f7fcfb] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#008b80]" />
            <p className="text-xs font-semibold leading-relaxed text-[#64748b]">
              Every new profile is created as a member. Manager permission is approved from the dashboard.
            </p>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryButtonClass}>
          {isSubmitting ? 'Creating account...' : 'Create Member Account'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>
    </AuthShell>
  )
}
