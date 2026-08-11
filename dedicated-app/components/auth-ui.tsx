'use client'

import Link from 'next/link'
import type {
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import {
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  type LucideProps,
} from 'lucide-react'
import { IconInput } from '@/components/mobile/icon-input'
import { BrandBuildingArt } from '@/components/brand-building-art'

type IconType = ComponentType<LucideProps>

export const authLinkClass =
  'font-semibold text-[#008d8c] transition hover:text-[#00777a]'

export function AuthShell({
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
  variant = 'default',
  icon: HeroIcon = ShieldCheck,
}: {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
  variant?: 'default' | 'reference'
  icon?: IconType
}) {
  const reference = variant === 'reference'

  return (
    <div className={reference ? 'auth-reference' : 'min-h-screen px-4 py-6'}>
      {reference ? <BrandBuildingArt placement="auth" /> : null}
      <div
        className={reference ? 'auth-reference__inner' : `mx-auto flex min-h-[calc(100vh-3rem)] w-full ${maxWidth} flex-col`}
      >
        <main className={reference ? 'auth-reference__main' : 'flex flex-1 items-center py-4'}>
          <section className={reference ? 'auth-reference__surface' : 'w-full rounded-[20px] border border-white/80 bg-white/94 p-4 shadow-[0_28px_70px_rgba(18,55,72,0.18)] backdrop-blur min-[360px]:p-5'}>
            <div className={reference ? 'auth-reference__heading' : 'mb-5 text-center'}>
              {reference ? (
                <div className="auth-reference__intro">
                  <div className="auth-reference__content">
                    <div className="auth-reference__hero-icon" aria-hidden="true">
                      <HeroIcon size={34} strokeWidth={1.8} />
                    </div>

                    <h1 className="auth-reference__title">{title}</h1>
                    {description ? <p className="auth-reference__description">{description}</p> : null}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#008d8c] text-white shadow-[0_12px_24px_rgba(0,141,140,0.22)]">
                    <HeroIcon size={30} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-5 text-headline font-bold text-[#062b35]">{title}</h1>
                  {description ? (
                    <p className="mx-auto mt-10 max-w-[310px] text-label text-[#65838b]">
                      {description}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {children}

            <div className={reference ? 'auth-reference__protected' : 'mt-5 flex items-center gap-3 text-[#65838b]'}>
              <span className="h-px flex-1 bg-[#cbd8e1]" />

              <span className="inline-flex items-center gap-1.5 text-caption font-semibold">
                <ShieldCheck size={reference ? 22 : 14} className="text-[#008d8c]" />
                Protected access
              </span>

              <span className="h-px flex-1 bg-[#cbd8e1]" />
            </div>
          </section>
        </main>

        {footer ? (
          <div className="mt-4 text-center text-label font-medium text-[#65838b]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AuthMessage({
  children,
  success = false,
}: {
  children: ReactNode
  success?: boolean
}) {
  const StatusIcon = success ? CircleCheck : CircleAlert

  return (
    <div
      className={`mb-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-label font-semibold ${
        success
          ? 'border-[#bfe7e6] bg-[#edfafa] text-[#00777a]'
          : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'
      }`}
      role={success ? 'status' : 'alert'}
    >
      <StatusIcon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: IconType
}

export function AuthField({
  label,
  icon: Icon,
  className = '',
  ...props
}: AuthFieldProps) {
  return (
    <label className="block">
      <div className="sr-only">
        {label}
      </div>

      <IconInput
        icon={Icon}
        className={`min-h-[54px] rounded-[14px] border-[#bfe7e6] bg-white text-body ${className}`}
        {...props}
      />
    </label>
  )
}


export function AuthPasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
  autoComplete: string
}) {
  return (
    <label className="block">
      <div className="sr-only">
        {label}
      </div>

      <div
        className="
          relative flex min-h-[54px] items-center
          rounded-[14px]
          border border-[#bfe7e6]
          bg-white
          transition-all duration-200
          focus-within:border-[#008d8c]
          focus-within:ring-4
          focus-within:ring-[#008d8c]/10
        "
      >
        <span
          className="
            ml-2 grid h-8 w-8 shrink-0
            place-items-center
            text-[#008d8c]
          "
        >
          <LockKeyhole
            size={20}
            strokeWidth={2.3}
            aria-hidden="true"
          />
        </span>

        <input
          className="
            min-h-[54px] min-w-0 flex-1
            bg-transparent px-2 py-3
            text-body font-medium
            text-[#062b35]
            outline-none
            placeholder:text-[#8aa0a6]
          "
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />

        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={onToggle}
          className="
            mr-2 grid h-10 w-10 shrink-0
            place-items-center
            text-[#52727b]
            transition-colors duration-200
            hover:text-[#008d8c]
            focus-visible:outline-none
            focus-visible:text-[#008d8c]
          "
        >
          {show ? (
            <EyeOff size={21} strokeWidth={2.4} />
          ) : (
            <Eye size={21} strokeWidth={2.4} />
          )}
        </button>
      </div>
    </label>
  )
}

export function AuthSubmitButton({
  busy,
  busyLabel,
  children,
}: {
  busy: boolean
  busyLabel: string
  children: ReactNode
}) {
  return (
    <button
      className="primary-btn group relative flex min-h-[52px] w-full items-center justify-center py-3 text-body disabled:cursor-not-allowed disabled:opacity-70"
      type="submit"
      disabled={busy}
    >
      <span>{busy ? busyLabel : children}</span>

    </button>
  )
}

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.53l3.35-2.61Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
    </svg>
  )
}

export function AuthFooterLink({
  text,
  href,
  action,
}: {
  text: string
  href: string
  action: string
}) {
  return (
    <p>
      {text}{' '}
      <Link href={href} className={authLinkClass}>
        {action}
      </Link>
    </p>
  )
}
