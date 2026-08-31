'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import {
  AuthMessage,
  AuthShell,
  authFieldIconClass,
  authLinkClass,
  authPasswordInputClass,
  authPasswordToggleClass,
  authPrimaryButtonClass,
} from '@/components/auth-ui'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setIsSuccess(false)

    const email = sessionStorage.getItem('resetEmail')
    const otpVerified = sessionStorage.getItem('otpVerified')

    if (!email || otpVerified !== 'true') {
      setMessage('Please verify your OTP before resetting password.')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await apiClient.resetPassword(email, password)
      setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'Password reset successfully')
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('otpVerified')
      window.setTimeout(() => router.push('/login'), 900)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Password reset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Create a new password to secure your Messzen account."
      footer={
        <Link href="/login" className={`text-sm ${authLinkClass}`}>
          Back to sign in
        </Link>
      }
    >
      {message && <AuthMessage success={isSuccess}>{message}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className={authFieldIconClass} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={16} className={authFieldIconClass} />
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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

        <button type="submit" disabled={isSubmitting} className={authPrimaryButtonClass}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>
    </AuthShell>
  )
}
