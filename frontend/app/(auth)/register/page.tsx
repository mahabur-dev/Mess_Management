'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { ApiError } from '@/lib/api-client'

function RegisterField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#172554]">
        {label}
      </span>
      <span className="relative block">
        <input
          type={isPassword ? (visible ? 'text' : 'password') : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-12 w-full rounded-lg border border-[#d8e6f8] bg-white px-4 pr-11 text-[15px] font-semibold text-[#172554] shadow-[0_8px_22px_rgba(37,64,112,0.07)] outline-none transition placeholder:text-[#8a98b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#edf5ff] hover:text-[#2f80ed]"
            aria-label="Toggle password visibility"
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
    </label>
  )
}

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
    <main className="flex min-h-screen items-center justify-center bg-[#eef6ff] px-4 py-6 text-[#172554] sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(30,64,120,0.16)] backdrop-blur sm:p-8">
            <Link href="/" className="mb-7 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]">
                M
              </span>
              <span className="text-2xl font-black text-[#172554]">Mess.</span>
            </Link>

            <div className="mb-6">
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2563eb] shadow-[0_12px_24px_rgba(47,128,237,0.12)]">
                <UserRound size={25} />
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-normal text-[#0f1f4b] sm:text-4xl">
                Create account
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
                Start as a member and request manager access after login.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#dc2626]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <RegisterField
                label="Full Name"
                value={form.name}
                onChange={(value) => update('name', value)}
                placeholder="Your name"
                autoComplete="name"
              />
              <RegisterField
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(value) => update('email', value)}
                placeholder="contact@example.com"
                autoComplete="email"
              />
              <RegisterField
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(value) => update('phone', value)}
                placeholder="01700-000000"
                autoComplete="tel"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(value) => update('password', value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />
                <RegisterField
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(value) => update('confirmPassword', value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-lg border border-[#d8e6f8] bg-[#f8fbff] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#16a34a]" />
                  <p className="text-sm font-semibold leading-6 text-[#667085]">
                    Every new profile is created as a member. Manager permission is approved from the dashboard.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-13 w-full items-center justify-center rounded-lg bg-[#2563EB] px-6 text-base font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(37,99,235,0.28)] disabled:translate-y-0 disabled:opacity-70"
              >
                {isSubmitting ? 'Creating account...' : 'Create Member Account'}
                {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-[#667085]">
              Already have an account?{' '}
              <Link href="/login" className="font-black text-[#2563eb] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
    </main>
  )
}
