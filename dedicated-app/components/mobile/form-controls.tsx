'use client'

import type { ReactNode } from 'react'

type BaseFieldProps = {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}

export function FieldCard({ label, hint, className, children }: BaseFieldProps) {
  return (
    <label className={`block w-full ${className ?? ''}`}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="text-sm font-bold text-[#14324a]">{label}</div>
        {hint ? <div className="text-[11px] font-medium text-[#667b8a]">{hint}</div> : null}
      </div>
      {children}
    </label>
  )
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <FieldCard label={label} hint={hint}>
      <input className="field h-14" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </FieldCard>
  )
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <FieldCard label={label} hint={hint}>
      <textarea
        className="field min-h-32 resize-none"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FieldCard>
  )
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  getLabel,
}: {
  label: string
  hint?: string
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  getLabel?: (value: T) => string
}) {
  return (
    <FieldCard label={label} hint={hint}>
      <select className="field h-14" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel ? getLabel(option) : option}
          </option>
        ))}
      </select>
    </FieldCard>
  )
}

export function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-2xl border border-[#d8ecec] bg-white px-4 py-3">
      <div>
        <div className="text-sm font-bold text-[#14324a]">{label}</div>
        {hint ? <div className="mt-1 text-[11px] font-medium text-[#667b8a]">{hint}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? 'bg-[#fc782d]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow ? <div className="section-title mb-0">{eyebrow}</div> : null}
        <div className="text-base font-black text-[#14324a]">{title}</div>
        {description ? <div className="mt-1 text-xs text-[#667b8a]">{description}</div> : null}
      </div>
      {action}
    </div>
  )
}

export function SubmitButton({
  children,
  busy,
  onClick,
  type = 'button',
  disabled = false,
}: {
  children: ReactNode
  busy?: boolean
  onClick?: () => void | Promise<void>
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button type={type} className="primary-btn mt-1 w-full disabled:cursor-not-allowed disabled:opacity-70" onClick={onClick} disabled={busy || disabled}>
      {busy ? 'Saving...' : children}
    </button>
  )
}
