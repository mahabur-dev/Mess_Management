'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff, type LucideProps } from 'lucide-react'

type IconType = ComponentType<LucideProps>

export const authLinkClass = 'font-black text-[#008d8c] transition hover:text-[#00777a]'

export function AuthShell({
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}) {
  return (
    <div className="min-h-screen px-4 py-6">
      <div className={`mx-auto flex min-h-[calc(100vh-3rem)] w-full ${maxWidth} flex-col`}>
        <main className="flex flex-1 items-center py-6">
          <section className="w-full rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_rgba(0,119,122,0.14)] backdrop-blur">
            <div className="mb-6 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-white shadow-[0_18px_35px_rgba(0,119,122,0.12)] ring-1 ring-[#dff4f3]">
                <Image src="/icon.svg" alt="Mess Management logo" width={88} height={88} className="h-20 w-20 object-contain" priority />
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight text-[#123748]">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-[#65838b]">{description}</p>
            </div>

            {children}

            {footer ? <div className="mt-5 text-center text-sm font-semibold text-[#65838b]">{footer}</div> : null}
          </section>
        </main>
      </div>
    </div>
  )
}

export function AuthMessage({ children, success = false }: { children: ReactNode; success?: boolean }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        success
          ? 'border-[#bfe7e6] bg-[#edfafa] text-[#00777a]'
          : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'
      }`}
    >
      {children}
    </div>
  )
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: IconType
}

export function AuthField({ label, icon: Icon, className = '', ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-bold text-[#123748]">{label}</div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#008d8c]">
          <Icon size={17} />
        </span>
        <input className={`field h-14 rounded-2xl bg-white pl-12 pr-4 ${className}`} {...props} />
      </div>
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
      <div className="mb-2 text-sm font-bold text-[#123748]">{label}</div>
      <div className="relative">
        <input
          className="field h-14 rounded-2xl bg-white pl-4 pr-12"
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
          onClick={onToggle}
          className="absolute inset-y-0 right-3 grid w-9 place-items-center rounded-full text-[#65838b] transition hover:text-[#008d8c]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
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
    <button className="primary-btn flex h-14 w-full items-center justify-center gap-2 rounded-2xl disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={busy}>
      {busy ? busyLabel : children}
    </button>
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
