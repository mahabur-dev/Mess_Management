"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  Home,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'

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
            <h1 className="text-xl font-black text-[#172554]">Welcome back</h1>
            <p className="mt-1.5 text-sm font-semibold text-[#6b7a99]">
              Sign in to continue managing your mess account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-11 pr-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 pr-12 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#edf5ff] hover:text-[#2f80ed]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8a9bb5]">
                <ShieldCheck size={14} className="text-emerald-500" />
                Protected access
              </span>
              <Link href="/forget_password" className="text-sm font-bold text-[#2f80ed] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Footer Links Inside Card */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm font-semibold text-[#6b7a99]">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold text-[#2f80ed] hover:underline">
                Create one
              </Link>
            </p>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a9bb5] hover:text-[#2f80ed] transition">
              <Home size={13} />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}