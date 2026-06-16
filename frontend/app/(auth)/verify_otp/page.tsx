'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, RotateCcw, Home } from 'lucide-react'
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
    if (otp.length < 6) { setMessage('Please enter the 6-digit verification code.'); return }
    const email = sessionStorage.getItem('resetEmail')
    if (!email) { setMessage('Please request an OTP with your email first.'); return }
    setIsSubmitting(true)
    try {
      const result = await apiClient.verifyOtp(email, otp)
      setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'OTP verified successfully')
      sessionStorage.setItem('otpVerified', 'true')
      window.setTimeout(() => router.push('/reset_password'), 800)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP verification failed')
    } finally { setIsSubmitting(false) }
  }

  const handleResendOtp = async () => {
    const email = sessionStorage.getItem('resetEmail')
    setMessage(''); setIsSuccess(false)
    if (!email) { setMessage('Please request an OTP with your email first.'); return }
    setIsResending(true)
    try {
      const result = await apiClient.forgotPassword(email)
      setOtp(''); setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'A new OTP has been sent to your email.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend OTP')
    } finally { setIsResending(false) }
  }

  return (
    <div className="min-h-screen bg-[#fafcff] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="rounded-xl border border-[#e6ebf4] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          {/* Logo */}
          <div className="mb-7 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed] to-[#3b8cff] text-base font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)]">
                M
              </div>
              <div className="text-left">
                <p className="text-lg font-black text-[#172554] tracking-tight leading-none">Mess</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7a99]">Management</p>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-xl font-black text-[#172554]">Verify OTP</h1>
            <p className="mt-1.5 text-sm font-semibold text-[#6b7a99]">
              Enter the 6-digit code sent to your email address.
            </p>
          </div>

          {message && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${isSuccess ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700' : 'border-red-200/60 bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99] text-center">
                Verification Code
              </label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-center gap-2">
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-11 rounded-xl border border-[#d8e6f8] bg-white text-base font-black text-[#172554] shadow-sm data-[active=true]:border-[#2f80ed] data-[active=true]:ring-4 data-[active=true]:ring-[#2f80ed]/10"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <button
            type="button"
            disabled={isResending}
            onClick={() => void handleResendOtp()}
            className="mt-4 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#f8faff] disabled:opacity-70"
          >
            <RotateCcw size={16} />
            {isResending ? 'Resending...' : 'Resend OTP'}
          </button>

          {/* Footer Links Inside Card */}
          <div className="mt-6 space-y-3 text-center">
            <Link href="/forget_password" className="text-sm font-bold text-[#2f80ed] hover:underline">
              Back to email
            </Link>
            <div>
              <Link href="/login" className="text-sm font-semibold text-[#6b7a99] hover:text-[#2f80ed]">
                Remember your password? <span className="font-bold text-[#2f80ed]">Sign in</span>
              </Link>
            </div>
            <div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a9bb5] hover:text-[#2f80ed] transition">
                <Home size={13} />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}