'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import {
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  User,
  Phone,
  Lock,
  Home,
  ShieldCheck,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isSubmitting } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      await register(form.name, form.email, form.phone, form.password, 'MEMBER')
      router.push('/login')
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fafcff] flex items-center justify-center p-4">
      <div className="w-full max-w-[460px]">
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
            <h1 className="text-xl font-black text-[#172554]">Create account</h1>
            <p className="mt-1.5 text-sm font-semibold text-[#6b7a99]">
              Start as a member and request manager access after login.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-11 pr-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="contact@example.com"
                  autoComplete="email"
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-11 pr-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="01700-000000"
                  autoComplete="tel"
                  required
                  className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-11 pr-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min 6 chars"
                    autoComplete="new-password"
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
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Confirm</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Confirm"
                    autoComplete="new-password"
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
            </div>

            <div className="rounded-xl border border-[#d8e6f8] bg-[#f8faff] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                <p className="text-xs font-semibold leading-relaxed text-[#6b7a99]">
                  Every new profile is created as a member. Manager permission is approved from the dashboard.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account...' : 'Create Member Account'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Footer Links Inside Card */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm font-semibold text-[#6b7a99]">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#2f80ed] hover:underline">
                Sign in
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