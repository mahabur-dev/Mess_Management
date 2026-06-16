'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
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

      window.setTimeout(() => {
        router.push('/verify_otp')
      }, 800)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef6ff] px-4 py-6 text-[#172554] sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(30,64,120,0.16)] backdrop-blur sm:p-8">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#667085] transition hover:text-[#2563eb]">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="mb-7">
          {/* <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2563eb] shadow-[0_12px_24px_rgba(47,128,237,0.12)]">
            <Mail size={25} />
          </div> */}
          <h1 className="text-xl font-black leading-tight tracking-normal text-[#2A2A2E] sm:text-2xl">
            Forgot password
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
            Enter your email address and we will send an OTP to reset your password.
          </p>
        </div>

        {message && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-bold ${isSuccess ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' : 'border-[#fecaca] bg-[#fff1f2] text-[#dc2626]'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#172554]">
              Email Address
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 w-full rounded-lg border border-[#d8e6f8] bg-white px-4 text-[15px] font-semibold text-[#172554] shadow-[0_8px_22px_rgba(37,64,112,0.07)] outline-none transition placeholder:text-[#8a98b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/12"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex h-13 w-full mb-5 items-center justify-center rounded-lg bg-[#2563EB] px-6 text-base font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(37,99,235,0.28)] disabled:translate-y-0 disabled:opacity-70"
          >
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
          </button>
        </form>

        {/* <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#d8e6f8]" />
          <span className="text-xs font-black text-[#8a98b4]">OR</span>
          <div className="h-px flex-1 bg-[#d8e6f8]" />
        </div> */}

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
