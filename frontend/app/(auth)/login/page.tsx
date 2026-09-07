'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'
import { Mail, ShieldCheck } from 'lucide-react'

import { useAuth } from '@/app/context/auth-context'
import {
  AuthMessage,
  AuthPasswordField,
  AuthShell,
  AuthSubmitButton,
  AuthTextField,
  authLinkClass,
} from '@/components/auth-ui'
import { ApiError } from '@/lib/api-client'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { login, isSubmitting } = useAuth()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [requestError, setRequestError] = useState<unknown>(null)
  const [isVerifiedNoticeVisible, setVerifiedNoticeVisible] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifiedEmail = params.get('email')
    if (params.get('verified') === '1') {
      setVerifiedNoticeVisible(true)
      if (verifiedEmail) setEmail(verifiedEmail)
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setRequestError(null)
    setVerifiedNoticeVisible(false)
    setNeedsVerification(false)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'AUTH_EMAIL_VERIFICATION_REQUIRED') {
        const normalizedEmail = email.trim().toLowerCase()
        sessionStorage.setItem('registrationEmail', normalizedEmail)
        setNeedsVerification(true)
      }
      setRequestError(error)
    }
  }

  return (
    <AuthShell
      title={auth('login.title')}
      description={auth('login.description')}
      footer={
        <p className="text-sm font-semibold text-muted-foreground">
          {auth('login.noAccount')}{' '}
          <Link href="/register" className={authLinkClass}>
            {auth('links.createAccount')}
          </Link>
        </p>
      }
    >
      {isVerifiedNoticeVisible ? <AuthMessage success>{auth('login.verified')}</AuthMessage> : null}
      {requestError ? (
        <AuthMessage>
          {localizedErrorMessage(requestError, locale, auth('login.error'))}
          {needsVerification ? (
            <Link href="/verify_email" className="ml-1 underline underline-offset-2">
              {auth('links.verifyNow')}
            </Link>
          ) : null}
        </AuthMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthTextField
          id="login-email"
          label={auth('fields.email')}
          icon={Mail}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setRequestError(null)
            setNeedsVerification(false)
          }}
          placeholder={auth('placeholders.email')}
          autoComplete="email"
          maxLength={255}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.email') }),
            invalid: auth('validation.invalidEmail'),
          }}
          required
        />

        <AuthPasswordField
          id="login-password"
          label={auth('fields.password')}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setRequestError(null)
          }}
          placeholder={auth('placeholders.password')}
          autoComplete="current-password"
          minLength={6}
          maxLength={128}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.password') }),
            tooShort: auth('validation.passwordMinimum', { count: 6 }),
          }}
          showLabel={auth('visibility.showPassword')}
          hideLabel={auth('visibility.hidePassword')}
          required
        />

        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ShieldCheck size={14} className="text-[var(--brand)]" aria-hidden="true" />
            {auth('login.protectedAccess')}
          </span>
          <Link href="/forget_password" className={`text-sm ${authLinkClass}`}>
            {auth('login.forgotPassword')}
          </Link>
        </div>

        <AuthSubmitButton
          label={auth('login.submit')}
          pendingLabel={auth('login.submitting')}
          pending={isSubmitting}
        />
      </form>
    </AuthShell>
  )
}
