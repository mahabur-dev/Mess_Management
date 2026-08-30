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
  GoogleMark,
  authLinkClass,
} from '@/components/auth-ui'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'
import { googleAuthEnabled, isGoogleSignInCancelled } from '@/lib/native-google-auth'

export default function LoginPage() {
  const { login, loginWithGoogle, isSubmitting } = useAuth()
  const { locale } = useLocale()
  const auth = useTranslations('auth')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/')
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

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

  async function handleGoogleSignIn() {
    setError('')
    setIsGoogleSubmitting(true)

    try {
      await loginWithGoogle(redirectTo)
    } catch (err) {
      if (isGoogleSignInCancelled(err)) return
      setError(localizedErrorMessage(err, locale) || auth('googleLoginFailed'))
    } finally {
      setIsGoogleSubmitting(false)
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

      {googleAuthEnabled ? (
        <>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleGoogleSignIn()}
            className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#bfe7e6] bg-white px-4 text-body font-semibold text-[#163c45] shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {isGoogleSubmitting ? auth('connectingGoogle') : auth('continueWithGoogle')}
          </button>

          <div className="my-4 flex items-center gap-3 text-caption font-semibold text-[#7b9298]">
            <span className="h-px flex-1 bg-[#dbe7e9]" />
            <span>{auth('orUseEmail')}</span>
            <span className="h-px flex-1 bg-[#dbe7e9]" />
          </div>
        </>
      ) : null}

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
