'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, Eye, EyeOff, ShieldCheck, type LucideProps } from 'lucide-react'
import { IconInput } from '@/components/mobile/icon-input'

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
    <div className="min-h-screen px-5 pb-7 pt-[18vh]">
      <div className={`mx-auto flex min-h-[calc(82vh-1.75rem)] w-full ${maxWidth} flex-col`}>
        <main className="flex flex-1 items-start">
          <section className="w-full rounded-[22px] border border-white/80 bg-white/94 p-7 shadow-[0_28px_70px_rgba(18,55,72,0.18)] backdrop-blur">
            <div className="mb-7 text-center">
              <Image src="/icon.svg" alt="Messzen logo" width={112} height={112} className="mx-auto h-[92px] w-[92px] object-contain" priority />
              <div className="mt-1 text-[38px] font-black leading-none text-[#008d8c]">Messzen</div>
              <h1 className="mt-7 text-[32px] font-black leading-tight text-[#062b35]">{title}</h1>
              <p className="mx-auto mt-4 max-w-[310px] text-[17px] leading-8 text-[#65838b]">{description}</p>
            </div>

            {children}

            <div className="mt-7 flex items-center gap-4 text-[#65838b]">
              <span className="h-px flex-1 bg-[#cbd8e1]" />
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                <ShieldCheck size={22} className="text-[#008d8c]" />
                Protected access
              </span>
              <span className="h-px flex-1 bg-[#cbd8e1]" />
            </div>
          </section>
        </main>
        {footer ? <div className="mt-7 text-center text-[17px] font-medium text-[#65838b]">{footer}</div> : null}
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
      <div className="mb-3 text-[17px] font-bold text-[#062b35]">{label}</div>
      <IconInput icon={Icon} className={`h-[62px] rounded-[15px] border-[#bfe7e6] bg-white text-[18px] ${className}`} {...props} />
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
      <div className="mb-3 text-[17px] font-bold text-[#062b35]">{label}</div>
      <div className="relative">
        <input
          className="field field--leading-icon field--trailing-action h-[62px] rounded-[15px] border-[#bfe7e6] bg-white text-[18px]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
        <span className="field-icon field-icon--leading grid h-10 w-10 rounded-[10px] bg-[#008d8c] text-white">
          <ShieldCheck size={19} />
        </span>
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={onToggle}
          className="field-action transition hover:text-[#008d8c]"
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
    <button className="primary-btn relative flex h-[64px] w-full items-center justify-center gap-3 rounded-[16px] text-[20px] disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={busy}>
      <span>{busy ? busyLabel : children}</span>
      <ArrowRight className="absolute right-6" size={30} strokeWidth={2.2} />
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
