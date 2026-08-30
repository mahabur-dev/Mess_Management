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
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

export default function LoginPage() {
  const { login, isSubmitting } = useAuth()
  const { locale } = useLocale()
  const auth = useTranslations('auth')

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
      setError(localizedErrorMessage(err, locale) || auth('loginFailed'))
    }
  }

  return (
    <AuthShell
      title={auth('welcomeBack')}
      description={auth('signInDescription')}
      variant="reference"
      showLanguageToggle
      footer={
        <AuthFooterLink
          text={auth('noAccount')}
          href="/signup"
          action={auth('signUp')}
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
          label={auth('emailAddress')}
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="manager@example.com"
          autoComplete="email"
          required
        />

        <AuthPasswordField
          label={auth('password')}
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder={auth('enterPassword')}
          autoComplete="current-password"
        />

        <div className="grid gap-3 min-[360px]:grid-cols-2 min-[360px]:items-center">
          <button
            type="button"
            onClick={() => setRemember((current) => !current)}
            className="auth-remember inline-flex min-w-0 items-center justify-start gap-2 text-left text-label font-medium text-[#65838b]"
          >
            <span
              className={`auth-checkbox grid h-[22px] w-[22px] place-items-center rounded-md ${remember
                  ? 'bg-[#008d8c] text-white'
                  : 'border border-[#bfe7e6] bg-white text-transparent'
                }`}
            >
              <Check size={14} strokeWidth={3} />
            </span>

            {auth('rememberMe')}
          </button>

          <Link
            href="/forget_password"
            className={`min-w-0 text-left text-label min-[360px]:text-right ${authLinkClass}`}
          >
            {auth('forgotPassword')}
          </Link>
        </div>

        <AuthSubmitButton busy={isSubmitting} busyLabel={auth('signingIn')}>
          {auth('signIn')}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
