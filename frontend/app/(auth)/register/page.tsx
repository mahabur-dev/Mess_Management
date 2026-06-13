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
      <span className="mb-2 block text-sm font-semibold text-foreground">
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
          className="soft-input h-12 w-full px-4 pr-11 text-[15px] font-semibold shadow-sm"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-xl lg:min-h-[680px] lg:grid-cols-[450px_1fr] border border-border">
        {/* Left Form Section */}
        <section className="order-2 flex flex-col justify-center p-6 sm:p-9 lg:order-1 lg:p-12">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
              M
            </span>
            <span className="text-2xl font-black text-foreground">Mess.</span>
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-lg">
              <UserRound size={27} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Register as Member
            </h1>
            <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              Sign up as a normal member. Manager access comes after mess request approval.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              className="group mt-2 flex h-13 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-[#6f3df4] to-secondary px-6 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-70"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Member Account'}
              {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-border bg-muted/50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Every account is created as a member. You can request mess manager access after login.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </section>

        {/* Right Visual Section */}
        <section className="order-1 min-h-[260px] overflow-hidden lg:order-2 lg:min-h-full relative">
          <div className="relative h-full min-h-[260px] lg:min-h-full">
            <Image
              src="/Variety-fruits-vegetables(3).jpg"
              alt="Fresh vegetables and food"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
              quality={80}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,..."
              // blurDataURL="..." // Recommended: generate with plaiceholder
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#17106b]/80 via-primary/60 to-secondary/70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.25),transparent_28rem)]" />

            <div className="relative flex h-full min-h-[260px] flex-col justify-between p-7 text-white sm:p-10 lg:min-h-full">
              <Link href="/" className="hidden items-center gap-3 lg:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-primary">
                  M
                </span>
                <span className="text-2xl font-bold">Mess.</span>
              </Link>

              <div className="max-w-xl">
                <span className="mb-6 inline-flex rounded-full bg-white/15 px-5 py-1.5 text-xs font-semibold tracking-wider backdrop-blur-md">
                  MEMBER REGISTRATION
                </span>
                <h2 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">
                  Create account first.<br />Manage mess after approval.
                </h2>
                <p className="mt-6 max-w-lg text-base text-white/90">
                  Every user starts as a member. To become a mess manager, submit a mess registration request from the dashboard and wait for super admin approval.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                  <CheckCircle2 size={22} className="mb-3" />
                  <p className="text-sm font-semibold">Member-first flow</p>
                  <p className="mt-1 text-xs text-white/75">Clean approval system for managers.</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                  <Phone size={22} className="mb-3" />
                  <p className="text-sm font-semibold">Mobile friendly</p>
                  <p className="mt-1 text-xs text-white/75">Big controls for everyday mess users.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}