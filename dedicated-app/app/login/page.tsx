'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Mail } from 'lucide-react'
import { useAuth } from '../providers'
import { readPostLoginPath } from '@/lib/auth'
import {
  AuthFooterLink,
  AuthMessage,
  AuthPasswordField,
  AuthShell,
  AuthSubmitButton,
  AuthField,
  authLinkClass,
} from '@/components/auth-ui'

export default function LoginPage() {
  const { login, isSubmitting } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/')

  useEffect(() => {
    setRedirectTo(readPostLoginPath())
  }, [])

  async function handleSubmit() {
    setError('')

    try {
      await login(email, password, redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your account" 
      variant="reference"
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          href="/signup"
          action="Sign up"
        />
      }
    >
      {error ? <AuthMessage>{error}</AuthMessage> : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <AuthField
          label="Email address"
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="manager@example.com"
          autoComplete="email"
          required
        />

        <AuthPasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <div className="grid gap-3 min-[360px]:grid-cols-2 min-[360px]:items-center">
          <button
            type="button"
            onClick={() => setRemember((current) => !current)}
            className="inline-flex min-w-0 items-center justify-start gap-2 text-left text-label font-medium text-[#65838b]"
          >
            <span
              className={`grid h-[22px] w-[22px] place-items-center rounded-md ${remember
                  ? 'bg-[#008d8c] text-white'
                  : 'border border-[#bfe7e6] bg-white text-transparent'
                }`}
            >
              <Check size={14} strokeWidth={3} />
            </span>

            Remember me
          </button>

          <Link
            href="/forget_password"
            className={`min-w-0 text-left text-label min-[360px]:text-right ${authLinkClass}`}
          >
            Forgot password?
          </Link>
        </div>

        <AuthSubmitButton busy={isSubmitting} busyLabel="Signing in...">
          Sign In
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
