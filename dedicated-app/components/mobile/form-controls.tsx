'use client'

import type { ReactNode } from 'react'
import { ChevronDown, Grip } from 'lucide-react'
import { MobileSelectSheet } from '@/components/mobile/select-sheet'

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
        <div className="text-label font-bold text-[#123748]">{label}</div>
        {hint ? <div className="text-caption font-medium text-[#65838b]">{hint}</div> : null}
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
      <input className="field min-h-14" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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

// export function SelectField<T extends string>({
//   label,
//   hint,
//   value,
//   onChange,
//   options,
//   getLabel,
// }: {
//   label: string
//   hint?: string
//   value: T
//   onChange: (value: T) => void
//   options: readonly T[]
//   getLabel?: (value: T) => string
// }) {
//   return (
//     <FieldCard label={label} hint={hint}>
//       <select className="field h-14 pr-2" value={value} onChange={(e) => onChange(e.target.value as T)}>
//         {options.map((option) => (
//           <option key={option} value={option}>
//             {getLabel ? getLabel(option) : option}
//           </option>
//         ))}
//       </select>
//     </FieldCard>
//   )
// }
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
  const selectOptions = options.map((option) => ({
    value: option,
    label: getLabel ? getLabel(option) : option,
    description:
      option === 'Manager'
        ? 'Can manage members, meals and expenses'
        : option === 'Member'
          ? 'Can view and manage personal activities'
          : undefined,
  }))

  return (
    <MobileSelectSheet
      label={label}
      value={value}
      options={selectOptions}
      onChange={onChange}
      renderTrigger={({ open, selectedLabel, buttonProps }) => (
        <FieldCard label={label} hint={hint}>
          <button
            {...buttonProps}
            className="
              flex h-14 w-full items-center
              rounded-2xl
              border border-[#bfe7e6]
              bg-white px-4
              text-left
              transition-all duration-200
              hover:border-[#8fd2d0]
              focus-visible:border-[#008d8c]
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#008d8c]/10
            "
          >
            <span
            className="
              grid h-9 w-9 shrink-0
              place-items-center
              rounded-xl
              bg-[#f4fbfb]
              text-[#008d8c]
            "
            >
              <Grip size={18} strokeWidth={2.2} />
            </span>

            <span className="min-w-0 flex-1 truncate text-body font-semibold text-[#123748]">
              {selectedLabel}
            </span>

            <ChevronDown
              size={20}
              strokeWidth={2.4}
              className={`shrink-0 text-[#008d8c] transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>
        </FieldCard>
      )}
    />
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
    <div className="flex w-full items-center justify-between rounded-2xl border border-[#cfeeed] bg-white px-4 py-3">
      <div>
        <div className="text-label font-bold text-[#123748]">{label}</div>
        {hint ? <div className="mt-1 text-caption font-medium text-[#65838b]">{hint}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? 'bg-[#008d8c]' : 'bg-[#9edddc]'
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
        <div className="text-body font-bold text-[#123748]">{title}</div>
        {description ? <div className="mt-1 text-label text-[#65838b]">{description}</div> : null}
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
