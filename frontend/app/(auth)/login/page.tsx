'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
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

export default function LoginPage() {
  const router = useRouter()
  const { login, isSubmitting } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifiedEmail = params.get('email')
    if (params.get('verified') === '1') {
      setNotice('Email verified successfully. Sign in with your password.')
      if (verifiedEmail) setEmail(verifiedEmail)
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setNeedsVerification(false)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'AUTH_EMAIL_VERIFICATION_REQUIRED') {
        const normalizedEmail = email.trim().toLowerCase()
        sessionStorage.setItem('registrationEmail', normalizedEmail)
        setNeedsVerification(true)
      }
      setError(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue managing your Messzen workspace."
      footer={
        <p className="text-sm font-semibold text-[#64748b]">
          Don't have an account?{' '}
          <Link href="/register" className={authLinkClass}>
            Create one
          </Link>
        </p>
      }
    >
      {notice && <AuthMessage success>{notice}</AuthMessage>}
      {error && (
        <AuthMessage>
          {error}
          {needsVerification && (
            <Link href="/verify_email" className="ml-1 underline underline-offset-2">
              Verify now
            </Link>
          )}
        </AuthMessage>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className={authFieldIconClass} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className={authInputWithIconClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className={authFieldIconClass} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
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

        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748b]">
            <ShieldCheck size={14} className="text-emerald-500" />
            Protected access
          </span>
          <Link href="/forget_password" className={`text-sm ${authLinkClass}`}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryButtonClass}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>
    </AuthShell>
  )
}
