'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { Mail, Phone, User } from 'lucide-react'

import { useAuth } from '@/app/context/auth-context'
import {
  AuthInfoPanel,
  AuthMessage,
  AuthPasswordField,
  AuthShell,
  AuthSubmitButton,
  AuthTextField,
  authLinkClass,
} from '@/components/auth-ui'
import { localizedErrorMessage, useLocale, useTranslations, type MessageKey } from '@/lib/i18n'

type RegistrationValidationKey = Extract<
  MessageKey<'auth'>,
  'validation.passwordMinimum' | 'validation.passwordsMismatch'
>

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isSubmitting } = useAuth()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [form, setForm] = useState(initialForm)
  const [validationKey, setValidationKey] = useState<RegistrationValidationKey | null>(null)
  const [requestError, setRequestError] = useState<unknown>(null)

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setValidationKey(null)
    setRequestError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setValidationKey(null)
    setRequestError(null)

    if (form.password.length < 6) {
      setValidationKey('validation.passwordMinimum')
      return
    }
    if (form.password !== form.confirmPassword) {
      setValidationKey('validation.passwordsMismatch')
      return
    }

    try {
      const challenge = await register(form.name, form.email, form.phone, form.password)
      sessionStorage.setItem('registrationEmail', challenge.email)
      sessionStorage.setItem(
        'registrationResendAt',
        String(Date.now() + challenge.resendAvailableInSeconds * 1000),
      )
      router.push('/verify_email')
    } catch (error) {
      setRequestError(error)
    }
  }

  const passwordError = validationKey === 'validation.passwordMinimum'
    ? auth(validationKey, { count: 6 })
    : undefined
  const confirmationError = validationKey === 'validation.passwordsMismatch'
    ? auth(validationKey)
    : undefined
  const requestErrorMessage = requestError
    ? localizedErrorMessage(requestError, locale, auth('register.error'))
    : ''

  return (
    <AuthShell
      title={auth('register.title')}
      description={auth('register.description')}
      maxWidth="max-w-[500px]"
      footer={
        <p className="text-sm font-semibold text-muted-foreground">
          {auth('register.hasAccount')}{' '}
          <Link href="/login" className={authLinkClass}>
            {auth('links.signIn')}
          </Link>
        </p>
      }
    >
      {requestErrorMessage ? <AuthMessage>{requestErrorMessage}</AuthMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          id="register-name"
          label={auth('fields.fullName')}
          icon={User}
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder={auth('placeholders.name')}
          autoComplete="name"
          maxLength={100}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.fullName') }),
          }}
          required
        />

        <AuthTextField
          id="register-email"
          label={auth('fields.email')}
          icon={Mail}
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          placeholder={auth('placeholders.email')}
          autoComplete="email"
          maxLength={255}
          validationMessages={{
            required: auth('validation.required', { field: auth('fields.email') }),
            invalid: auth('validation.invalidEmail'),
          }}
          required
        />

        <AuthTextField
          id="register-phone"
          label={<>{auth('fields.phone')} <span className="font-normal text-muted-foreground">({auth('fields.optional')})</span></>}
          icon={Phone}
          type="tel"
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          placeholder={auth('placeholders.phone')}
          autoComplete="tel"
          maxLength={40}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthPasswordField
            id="register-password"
            label={auth('fields.password')}
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            placeholder={auth('placeholders.passwordMinimum', { count: 6 })}
            autoComplete="new-password"
            showLabel={auth('visibility.showPassword')}
            hideLabel={auth('visibility.hidePassword')}
            minLength={6}
            maxLength={128}
            error={passwordError}
            validationMessages={{
              required: auth('validation.required', { field: auth('fields.password') }),
              tooShort: auth('validation.passwordMinimum', { count: 6 }),
            }}
            required
          />
          <AuthPasswordField
            id="register-confirm-password"
            label={auth('fields.confirmPassword')}
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            placeholder={auth('placeholders.confirmPassword')}
            autoComplete="new-password"
            showLabel={auth('visibility.showConfirmation')}
            hideLabel={auth('visibility.hideConfirmation')}
            minLength={6}
            maxLength={128}
            error={confirmationError}
            validationMessages={{
              required: auth('validation.required', { field: auth('fields.confirmPassword') }),
              tooShort: auth('validation.passwordMinimum', { count: 6 }),
            }}
            required
          />
        </div>

        <AuthInfoPanel>{auth('register.memberNotice')}</AuthInfoPanel>

        <AuthSubmitButton
          label={auth('register.submit')}
          pendingLabel={auth('register.submitting')}
          pending={isSubmitting}
        />
      </form>
    </AuthShell>
  )
}
