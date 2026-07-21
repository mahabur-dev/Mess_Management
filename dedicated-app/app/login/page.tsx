'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../providers'
import { readPostLoginPath } from '@/lib/auth'
import { AuthFooterLink, AuthMessage, AuthPasswordField, AuthShell, AuthSubmitButton, AuthField, authLinkClass } from '@/components/auth-ui'

export default function LoginPage() {
  const { login, isSubmitting } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      title="Log in to your account"
      description="Access your mess dashboard, members, meals, and expenses securely."
      footer={<AuthFooterLink text="Don't have an account?" href="/signup" action="Sign up" />}
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

        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#65838b]">
            <ShieldCheck size={14} className="text-[#008d8c]" />
            Protected access
          </span>
          <Link href="/forget_password" className={`text-sm ${authLinkClass}`}>
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
