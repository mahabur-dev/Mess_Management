'use client'

import Link from 'next/link'
import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LoaderCircle,
  Lock,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { EnterpriseFormField } from '@/components/ui/enterprise-form-field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'
import { useTranslations, type MessageKey } from '@/lib/i18n'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  maxWidth?: string
}

export const authInputClass =
  'h-12 w-full rounded-lg border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 text-sm font-medium text-foreground shadow-none outline-none placeholder:text-muted-foreground transition-[border-color,box-shadow] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-ring)]'

export const authInputWithIconClass = cn(authInputClass, 'pl-11')

export const authPasswordInputClass = cn(authInputClass, 'pr-12')

export const authFieldIconClass =
  'absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand)]'

export const authPasswordToggleClass =
  'absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]'

export const authPrimaryButtonClass =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-6 text-sm font-semibold text-white shadow-none transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:opacity-70'

export const authSecondaryButtonClass =
  'flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 text-sm font-semibold text-[var(--brand)] shadow-none transition-colors hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:opacity-70'

export const authLinkClass =
  'font-bold text-[var(--brand)] underline-offset-4 transition hover:text-[var(--brand-dark)] hover:underline'

export function AuthMessage({ children, success }: { children: ReactNode; success?: boolean }) {
  return (
    <div
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
      className={cn(
        'mb-5 rounded-md border px-4 py-3 text-sm font-bold',
        success
          ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-dark)]'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {children}
    </div>
  )
}

interface AuthConstraintMessages {
  required?: string
  invalid?: string
  tooShort?: string
  tooLong?: string
}

function setLocalizedConstraintMessage(
  event: FormEvent<HTMLInputElement>,
  messages?: AuthConstraintMessages,
) {
  const input = event.currentTarget
  input.setCustomValidity('')
  const validity = input.validity
  const message = validity.valueMissing
    ? messages?.required
    : validity.typeMismatch || validity.patternMismatch
      ? messages?.invalid
      : validity.tooShort
        ? messages?.tooShort
        : validity.tooLong
          ? messages?.tooLong
          : undefined
  if (message) input.setCustomValidity(message)
}

interface AuthTextFieldProps extends Omit<ComponentProps<'input'>, 'className'> {
  id: string
  label: ReactNode
  icon: LucideIcon
  error?: string
  validationMessages?: AuthConstraintMessages
}

export function AuthTextField({
  id,
  label,
  icon: Icon,
  error,
  required,
  validationMessages,
  onChange,
  onInvalid,
  ...props
}: AuthTextFieldProps) {
  const describedBy = error ? `${id}-error` : props['aria-describedby']

  return (
    <EnterpriseFormField
      htmlFor={id}
      label={label}
      required={required}
      error={error ? <span id={`${id}-error`}>{error}</span> : undefined}
      labelClassName="enterprise-kicker text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
    >
      <div className="relative">
        <Icon size={16} className={authFieldIconClass} aria-hidden="true" />
        <input
          {...props}
          id={id}
          required={required}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy}
          className={authInputWithIconClass}
          onChange={(event) => {
            event.currentTarget.setCustomValidity('')
            onChange?.(event)
          }}
          onInvalid={(event) => {
            setLocalizedConstraintMessage(event, validationMessages)
            onInvalid?.(event)
          }}
        />
      </div>
    </EnterpriseFormField>
  )
}

interface AuthPasswordFieldProps
  extends Omit<ComponentProps<'input'>, 'className' | 'type'> {
  id: string
  label: ReactNode
  showLabel: string
  hideLabel: string
  error?: string
  validationMessages?: AuthConstraintMessages
}

export function AuthPasswordField({
  id,
  label,
  showLabel,
  hideLabel,
  error,
  required,
  validationMessages,
  onChange,
  onInvalid,
  ...props
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const describedBy = error ? `${id}-error` : props['aria-describedby']

  return (
    <EnterpriseFormField
      htmlFor={id}
      label={label}
      required={required}
      error={error ? <span id={`${id}-error`}>{error}</span> : undefined}
      labelClassName="enterprise-kicker text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
    >
      <div className="relative">
        <Lock size={16} className={authFieldIconClass} aria-hidden="true" />
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy}
          className={`${authPasswordInputClass} pl-11`}
          onChange={(event) => {
            event.currentTarget.setCustomValidity('')
            onChange?.(event)
          }}
          onInvalid={(event) => {
            setLocalizedConstraintMessage(event, validationMessages)
            onInvalid?.(event)
          }}
        />
        <button
          type="button"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className={authPasswordToggleClass}
        >
          {visible
            ? <EyeOff size={17} aria-hidden="true" />
            : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
    </EnterpriseFormField>
  )
}

interface AuthOtpFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  error?: string
}

export function AuthOtpField({ id, label, value, onChange, autoFocus, error }: AuthOtpFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="enterprise-kicker mb-3 block text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
      >
        {label}
      </label>
      <InputOTP
        id={id}
        maxLength={6}
        value={value}
        onChange={onChange}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        containerClassName="justify-center gap-2"
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="h-12 w-11 rounded-md border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-base font-semibold text-foreground shadow-none data-[active=true]:border-[var(--brand)] data-[active=true]:ring-4 data-[active=true]:ring-[var(--brand-ring)]"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function AuthInfoPanel({ children, icon: Icon = ShieldCheck }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="rounded-lg border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-4">
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-[var(--brand)]" aria-hidden="true" />
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

interface AuthSubmitButtonProps {
  label: string
  pendingLabel: string
  pending?: boolean
  disabled?: boolean
}

export function AuthSubmitButton({
  label,
  pendingLabel,
  pending = false,
  disabled = false,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={authPrimaryButtonClass}
    >
      {pending ? (
        <LoaderCircle className="size-[18px] animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : null}
      {pending ? pendingLabel : label}
      {!pending ? <ArrowRight size={18} aria-hidden="true" /> : null}
    </button>
  )
}

interface AuthSecondaryButtonProps {
  label: string
  pendingLabel: string
  onClick: () => void
  icon?: LucideIcon
  pending?: boolean
  disabled?: boolean
  className?: string
}

export function AuthSecondaryButton({
  label,
  pendingLabel,
  onClick,
  icon: Icon,
  pending = false,
  disabled = false,
  className,
}: AuthSecondaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      aria-busy={pending || undefined}
      className={cn(authSecondaryButtonClass, className)}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={16} aria-hidden="true" />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  )
}

export function AuthShell({ title, description, children, footer, maxWidth = 'max-w-[440px]' }: AuthShellProps) {
  const auth = useTranslations('authShared')
  const featureKeys: MessageKey<'authShared'>[] = [
    'protectedAccess',
    'memberReady',
    'managerTools',
  ]

  return (
    <main className="auth-page marketing-page fixed inset-0 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_440px]">
          <aside className="hidden lg:block">
            <BrandLogo subtitle={auth('brandSubtitle')} />
            <h1 className="mt-10 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-foreground">
              {auth('heroTitle')}
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-8 text-muted-foreground">
              {auth('heroDescription')}
            </p>
            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              {featureKeys.map((key) => (
                <div key={key} className="border-l border-[var(--brand-border)] pl-4">
                  <CheckCircle2 size={18} className="text-[var(--brand)]" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-foreground">{auth(key)}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className={cn('w-full justify-self-center lg:justify-self-end', maxWidth)}>
            <div className="marketing-card rounded-2xl p-6 sm:p-8">
              <div className="mb-7 text-center lg:hidden">
                <BrandLogo className="justify-center" subtitle={auth('brandSubtitle')} />
              </div>

              <div className="mb-7 border-b border-[var(--marketing-line)] pb-5">
                <span className="enterprise-kicker text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                  {auth('accountAccess')}
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{description}</p>
              </div>

              {children}

              <div className="mt-6 space-y-3 text-center">{footer}</div>
            </div>

            <Link
              href="/"
              className="mx-auto mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-[var(--brand)]"
            >
              <Home size={13} aria-hidden="true" />
              {auth('backHome')}
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
