'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, Home } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function ForgetPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
            <h1 className="text-xl font-black text-[#172554]">Forgot password</h1>
            <p className="mt-1.5 text-sm font-semibold text-[#6b7a99]">
              Enter your email address and we will send an OTP to reset your password.
            </p>
          </div>

          {message && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${isSuccess ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700' : 'border-red-200/60 bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-11 pr-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
            >
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
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