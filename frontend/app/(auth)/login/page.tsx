"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'

function LoginField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  showToggle,
  onToggle,
  isVisible,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete?: string
  showToggle?: boolean
  onToggle?: () => void
  isVisible?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#172554]">
        {label}
      </span>
      <span className="relative block">
        <input
          type={showToggle && isVisible !== undefined ? (isVisible ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-12 w-full rounded-lg border border-[#d8e6f8] bg-white px-4 pr-11 text-[15px] font-semibold text-[#172554] shadow-[0_8px_22px_rgba(37,64,112,0.07)] outline-none transition placeholder:text-[#8a98b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/12"
        />
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#edf5ff] hover:text-[#2f80ed]"
            aria-label="Toggle password visibility"
          >
            {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
    </label>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isSubmitting } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef6ff] px-4 py-6 text-[#172554] sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(30,64,120,0.16)] backdrop-blur sm:p-8">
            <Link href="/" className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]">
                M
              </span>
              <span className="text-2xl font-black text-[#172554]">Mess.</span>
            </Link>

            <div className="mb-7">
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2563eb] shadow-[0_12px_24px_rgba(47,128,237,0.12)]">
                <LockKeyhole size={25} />
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-normal text-[#0f1f4b] sm:text-4xl">
                Welcome back
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
                Sign in to continue managing your mess account.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#dc2626]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <LoginField
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <LoginField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoComplete="current-password"
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                isVisible={showPassword}
              />

              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-[#667085]">
                  <BadgeCheck size={15} className="text-[#16a34a]" />
                  Protected access
                </span>
                <Link href="/forget_password" className="text-sm font-bold text-[#2563eb] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-2 flex h-13 w-full items-center justify-center rounded-lg bg-[#2563EB] px-6 text-base font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(37,99,235,0.28)] disabled:translate-y-0 disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#d8e6f8]" />
              <span className="text-xs font-black text-[#8a98b4]">OR</span>
              <div className="h-px flex-1 bg-[#d8e6f8]" />
            </div>

            <p className="text-center text-sm font-semibold text-[#667085]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-black text-[#2563eb] hover:underline">
                Create one
              </Link>
            </p>
          </div>
    </main>
  )
}
