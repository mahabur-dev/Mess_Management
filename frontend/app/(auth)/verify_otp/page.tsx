'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { apiClient } from '@/lib/api-client'

export default function VerifyOtp() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const successMessage = result.data?.message || result.message || 'OTP verified successfully'
      setIsSuccess(true)
      setMessage(successMessage)
      sessionStorage.setItem('otpVerified', 'true')

      window.setTimeout(() => {
        router.push('/reset_password')
      }, 800)
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
    <main className="flex min-h-screen items-center justify-center bg-[#eef6ff] px-4 py-6 text-[#172554] sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(30,64,120,0.16)] backdrop-blur sm:p-8">
        <Link href="/forget_password" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#667085] transition hover:text-[#2563eb]">
          <ArrowLeft size={16} />
          Back to email
        </Link>

        <div className="mb-7">
          {/* <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2563eb] shadow-[0_12px_24px_rgba(47,128,237,0.12)]">
            <ShieldCheck size={25} />
          </div> */}
          <h1 className="text-xl font-black leading-tight tracking-normal text-[#2A2A2E] sm:text-2xl">
            Verify OTP
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
            Enter the 6-digit code sent to your email address.
          </p>
        </div>

        {message && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-bold ${isSuccess ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' : 'border-[#fecaca] bg-[#fff1f2] text-[#dc2626]'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-3 block text-sm font-bold text-[#172554]">
              Verification Code
            </span>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              containerClassName="justify-center gap-2"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-11 w-10 rounded-lg border border-[#d8e6f8] bg-white text-base font-black text-[#172554] shadow-[0_8px_22px_rgba(37,64,112,0.07)] data-[active=true]:border-[#2f80ed] data-[active=true]:ring-4 data-[active=true]:ring-[#2f80ed]/12 sm:h-12 sm:w-12"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex h-13 mb-5 w-full items-center justify-center rounded-lg bg-[#2563EB] px-6 text-base font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(37,99,235,0.28)] disabled:translate-y-0 disabled:opacity-70"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Code'}
            {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
          </button>
        </form>

        {/* <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#d8e6f8]" />
          <span className="text-xs font-black text-[#8a98b4]">OR</span>
          <div className="h-px flex-1 bg-[#d8e6f8]" />
        </div> */}

        <button
          type="button"
          disabled={isResending}
          onClick={() => {
            void handleResendOtp()
          }}
          className="flex h-12 w-full mb-5 items-center justify-center gap-2 rounded-lg border border-[#d8e6f8] bg-[#f8fbff] px-4 text-sm font-black text-[#2563eb] transition hover:border-[#2f80ed] hover:bg-[#edf5ff] disabled:opacity-70"
        >
          <RotateCcw size={16} />
          {isResending ? 'Resending...' : 'Resend OTP'}
        </button>

        <p className="mt-7 text-center text-sm font-semibold text-[#667085]">
          Remember your password?{' '}
          <Link href="/login" className="font-black text-[#2563eb] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
