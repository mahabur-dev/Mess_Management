'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Phone, ShieldCheck, UserRound } from 'lucide-react'
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
      <span className="mb-2 block text-sm font-black text-[#101a3d]">{label}</span>
      <span className="relative block">
        <input
          type={isPassword ? (visible ? 'text' : 'password') : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-12 w-full rounded-xl border-2 border-[#e3e8f2] bg-white px-4 pr-11 text-[15px] font-semibold text-[#0a1433] shadow-[0_6px_18px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#6f3df4] focus:ring-4 focus:ring-[#6f3df4]/12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7a8499] transition hover:bg-[#f3f0ff] hover:text-[#6f3df4]"
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
      router.push('/dashboard')
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Registration failed. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-4 sm:p-6">
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(25,31,76,0.16)] lg:min-h-[680px] lg:grid-cols-[450px_1fr]">
        <section className="order-2 flex flex-col justify-center p-6 sm:p-9 lg:order-1 lg:p-12">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#6f3df4] to-[#2f5bf6] text-sm font-black text-white">
              M
            </span>
            <span className="text-2xl font-black text-[#0a1433]">Mess.</span>
          </Link>

          <div className="mb-8">
            <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efe9ff] text-[#6f3df4] shadow-[0_12px_28px_rgba(111,61,244,0.16)]">
              <UserRound size={27} />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-[#0a1433] sm:text-4xl">Register as Member</h1>
            <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-[#667085]">
              Sign up as a normal member. Manager access comes after mess request approval.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
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
              placeholder="contact@mr.com"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-2 flex h-13 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#315bf6] to-[#713cf2] px-5 text-base font-black text-white shadow-[0_16px_32px_rgba(80,70,230,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(80,70,230,0.34)] disabled:translate-y-0 disabled:opacity-65"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Member Account'}
              {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-6 grid gap-3 rounded-2xl border border-[#e7ebf3] bg-[#fbfcff] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-[#22b66f]" />
              <p className="text-xs font-bold leading-5 text-[#667085]">
                Every account is created as a member. You can request mess manager access after login.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-bold text-[#667085]">
            Already have an account?{' '}
            <Link href="/login" className="font-black text-[#6f3df4] hover:underline">
              Sign in
            </Link>
          </p>
        </section>

        <section className="order-1 min-h-[260px] overflow-hidden lg:order-2 lg:min-h-full">
          <div className="relative h-full min-h-[260px] lg:min-h-full">
            <Image
              src="/Variety-fruits-vegetables(3).jpg"
              alt="Fresh vegetables and food"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
              quality={75}        // ← add this, default is 75 but be explicit
              placeholder="blur"  // ← add this for perceived speed
              blurDataURL="data:image/jpeg;base64,..." // generate with plaiceholder
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#17106b]/82 via-[#6f3df4]/64 to-[#2f5bf6]/74" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.24),transparent_26rem)]" />

            <div className="relative flex h-full min-h-[260px] flex-col justify-between p-7 text-white sm:p-10 lg:min-h-full">
              <Link href="/" className="hidden items-center gap-3 lg:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-[#6f3df4]">M</span>
                <span className="text-2xl font-black">Mess.</span>
              </Link>

              <div className="max-w-xl">
                <span className="mb-6 inline-flex rounded-full bg-white/14 px-4 py-2 text-xs font-black text-white backdrop-blur">
                  Member Registration
                </span>
                <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Create account first. Manage mess after approval.
                </h2>
                <p className="mt-6 max-w-lg text-sm font-bold leading-7 text-white/86 sm:text-base">
                  Every user starts as a member. To become a mess manager, submit a mess registration request from the dashboard and wait for super admin approval.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/18 bg-white/12 p-4 backdrop-blur-xl">
                  <CheckCircle2 size={20} className="mb-3" />
                  <p className="text-sm font-black">Member-first flow</p>
                  <p className="mt-1 text-xs font-semibold text-white/76">Clean approval system for managers.</p>
                </div>
                <div className="rounded-2xl border border-white/18 bg-white/12 p-4 backdrop-blur-xl">
                  <Phone size={20} className="mb-3" />
                  <p className="text-sm font-black">Mobile friendly</p>
                  <p className="mt-1 text-xs font-semibold text-white/76">Big controls for everyday mess users.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
