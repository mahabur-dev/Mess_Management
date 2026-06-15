'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  visible: boolean
  onToggle: () => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#172554]">
        {label}
      </span>
      <span className="relative block">
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="h-12 w-full rounded-lg border border-[#d8e6f8] bg-white px-4 pr-11 text-[15px] font-semibold text-[#172554] shadow-[0_8px_22px_rgba(37,64,112,0.07)] outline-none transition placeholder:text-[#8a98b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/12"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#edf5ff] hover:text-[#2f80ed]"
          aria-label="Toggle password visibility"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  )
}

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

      window.setTimeout(() => {
        router.push('/login')
      }, 900)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Password reset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef6ff] px-4 py-6 text-[#172554] sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(30,64,120,0.16)] backdrop-blur sm:p-8">
        <Link href="/verify_otp" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#667085] transition hover:text-[#2563eb]">
          <ArrowLeft size={16} />
          Back to OTP
        </Link>

        <div className="mb-7">
          <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2563eb] shadow-[0_12px_24px_rgba(47,128,237,0.12)]">
            <LockKeyhole size={25} />
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-normal text-[#0f1f4b] sm:text-4xl">
            Reset password
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
            Create a new password to secure your mess account.
          </p>
        </div>

        {message && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-bold ${isSuccess ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' : 'border-[#fecaca] bg-[#fff1f2] text-[#dc2626]'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
            visible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />

          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex h-13 w-full items-center justify-center rounded-lg bg-[#2563EB] px-6 text-base font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(37,99,235,0.28)] disabled:translate-y-0 disabled:opacity-70"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
            {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#d8e6f8]" />
          <span className="text-xs font-black text-[#8a98b4]">OR</span>
          <div className="h-px flex-1 bg-[#d8e6f8]" />
        </div>

        <p className="text-center text-sm font-semibold text-[#667085]">
          Remember your password?{' '}
          <Link href="/login" className="font-black text-[#2563eb] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
