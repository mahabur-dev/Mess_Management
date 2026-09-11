'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'
import { ChevronDown, Grip, type LucideIcon } from 'lucide-react'
import { MobileSelectSheet } from '@/components/mobile/select-sheet'
import { Button } from '@/components/ui/button'

type BaseFieldProps = {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}

export function FieldCard({ label, hint, className, children }: BaseFieldProps) {
  return (
    <label className={`block w-full ${className ?? ''}`}>
      <div className="ui-field-heading">
        <div className="ui-field-label">{label}</div>
        {hint ? <div className="ui-field-hint">{hint}</div> : null}
      </div>
      {children}
    </label>
  )
}

export function SettingsSection({
  id,
  title,
  description,
  action,
  className,
  children,
}: {
  id: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`management-section ${className ?? ''}`.trim()}
      aria-labelledby={id}
    >
      <div className="management-section__header">
        <div className="management-section__heading">
          <h2 id={id} className="management-section__title">{title}</h2>
          {description ? <p className="management-section__description">{description}</p> : null}
        </div>
        {action ? <div className="management-section__action">{action}</div> : null}
      </div>
      <div className="management-section__content">{children}</div>
    </section>
  )
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  className = '',
  ...inputProps
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  type?: InputHTMLAttributes<HTMLInputElement>['type']
}) {
  return (
    <FieldCard label={label} hint={hint}>
      <input
        {...inputProps}
        className={`field min-h-14 ${type === 'date' ? 'personal-date-input' : ''} ${className}`.trim()}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
  maxLength,
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <FieldCard label={label} hint={hint}>
      <textarea
        className="field min-h-32 resize-none"
        rows={rows}
        maxLength={maxLength}
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
  icon: Icon = Grip,
}: {
  label: string
  hint?: string
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  getLabel?: (value: T) => string
  icon?: LucideIcon
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
              <Icon size={18} strokeWidth={2.2} />
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
    <Button
      type={type}
      className="w-full"
      busy={busy}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}
