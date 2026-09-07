'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import {
  AuthMessage,
  AuthShell,
  authFieldIconClass,
  authInputWithIconClass,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/components/auth-ui'

export default function ForgetPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSuccess(false)
    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await apiClient.forgotPassword(email.trim().toLowerCase())
      const successMessage = result.data?.message || result.message || 'OTP sent to your email'
      setIsSuccess(true)
      setMessage(successMessage)
      sessionStorage.setItem('resetEmail', email.trim().toLowerCase())
      window.setTimeout(() => router.push('/verify_otp'), 800)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email address and we will send an OTP to reset your password."
      footer={
        <Link href="/login" className={`text-sm ${authLinkClass}`}>
          Back to sign in
        </Link>
      }
    >
      {message && <AuthMessage success={isSuccess}>{message}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className={authFieldIconClass} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={authInputWithIconClass}
            />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryButtonClass}>
          {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>
    </AuthShell>
  )
}
