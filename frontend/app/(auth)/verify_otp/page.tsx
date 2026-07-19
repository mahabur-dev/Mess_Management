'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, RotateCcw } from 'lucide-react'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { apiClient } from '@/lib/api-client'
import {
  AuthMessage,
  AuthShell,
  authLinkClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth-ui'

export default function VerifyOtp() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setIsSuccess(false)
    if (otp.length < 6) {
      setMessage('Please enter the 6-digit verification code.')
      return
    }
    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      setMessage('Please request an OTP with your email first.')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await apiClient.verifyOtp(email, otp)
      setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'OTP verified successfully')
      sessionStorage.setItem('otpVerified', 'true')
      window.setTimeout(() => router.push('/reset_password'), 800)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP verification failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    const email = sessionStorage.getItem('resetEmail')
    setMessage('')
    setIsSuccess(false)
    if (!email) {
      setMessage('Please request an OTP with your email first.')
      return
    }
    setIsResending(true)
    try {
      const result = await apiClient.forgotPassword(email)
      setOtp('')
      setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'A new OTP has been sent to your email.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend OTP')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify OTP"
      description="Enter the 6-digit code sent to your email address."
      footer={
        <>
          <Link href="/forget_password" className={`text-sm ${authLinkClass}`}>
            Back to email
          </Link>
          <div>
            <Link href="/login" className="text-sm font-semibold text-[#64748b] transition hover:text-[#008b80]">
              Remember your password? <span className={authLinkClass}>Sign in</span>
            </Link>
          </div>
        </>
      }
    >
      {message && <AuthMessage success={isSuccess}>{message}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-3 block text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#64748b]">
            Verification Code
          </label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-center gap-2">
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-11 rounded-md border border-[#d8e8e7] bg-white text-base font-black text-[#071821] shadow-sm data-[active=true]:border-[#008b80] data-[active=true]:ring-4 data-[active=true]:ring-[#008b80]/10"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryButtonClass}>
          {isSubmitting ? 'Verifying...' : 'Verify Code'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>

      <button
        type="button"
        disabled={isResending}
        onClick={() => void handleResendOtp()}
        className={`mt-4 ${authSecondaryButtonClass}`}
      >
        <RotateCcw size={16} />
        {isResending ? 'Resending...' : 'Resend OTP'}
      </button>
    </AuthShell>
  )
}
