'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Home } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
            <h1 className="text-xl font-black text-[#172554]">Reset password</h1>
            <p className="mt-1.5 text-sm font-semibold text-[#6b7a99]">
              Create a new password to secure your mess account.
            </p>
          </div>

          {message && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${isSuccess ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700' : 'border-red-200/60 bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 pr-12 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] hover:bg-[#edf5ff] hover:text-[#2f80ed]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 pr-12 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] hover:bg-[#edf5ff] hover:text-[#2f80ed]"
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Footer Links Inside Card */}
          <div className="mt-6 space-y-3 text-center">
            <Link href="/login" className="text-sm font-bold text-[#2f80ed] hover:underline">
              Back to sign in
            </Link>
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