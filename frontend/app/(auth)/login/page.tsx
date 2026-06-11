"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { Eye, EyeOff, ArrowRight, UserRound } from 'lucide-react'
import Image from 'next/image'
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
      <span className="mb-2 block text-sm font-semibold text-foreground">
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
          className="soft-input h-12 w-full px-4 pr-11 text-[15px] font-semibold shadow-sm"
        />
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-xl lg:min-h-[680px] lg:grid-cols-[450px_1fr] border border-border">
        {/* Left — Login Form */}
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
              Welcome Back
            </h1>
            <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              Sign in to manage your mess account
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
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

            <div className="flex justify-end">
              <Link href="/forget_password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-2 flex h-13 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-[#6f3df4] to-secondary px-6 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <ArrowRight size={18} className="ml-2 transition group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </section>

        {/* Right — Visual Panel */}
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
                  MEMBER LOGIN
                </span>
                <h2 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">
                  Access your mess.<br />Track meals. Stay organized.
                </h2>
                <p className="mt-6 max-w-lg text-base text-white/90">
                  Sign in to view your daily menu, manage attendance, and handle mess-related tasks.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                  <div className="text-xl mb-2">🍽️</div>
                  <p className="text-sm font-semibold">Daily Meals</p>
                  <p className="mt-1 text-xs text-white/75">View today&apos;s menu and nutritional info.</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                  <div className="text-xl mb-2">📊</div>
                  <p className="text-sm font-semibold">Real-time Updates</p>
                  <p className="mt-1 text-xs text-white/75">Stay informed with live mess activity.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}