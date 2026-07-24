'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNativeBackAction } from '@/components/native-back-actions'
import {
  Check,
  ChevronDown,
  Circle,
  UserRound,
  X,
  Grip
} from 'lucide-react'

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
        <div className="text-sm font-bold text-[#123748]">{label}</div>
        {hint ? <div className="text-[11px] font-medium text-[#65838b]">{hint}</div> : null}
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
  const [open, setOpen] = useState(false)
  useNativeBackAction(open, () => {
    setOpen(false)
    return true
  })

  const selectedLabel = getLabel ? getLabel(value) : value

  function handleSelect(option: T) {
    onChange(option)
    setOpen(false)
  }

  return (
    <>
      <FieldCard label={label} hint={hint}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
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
          {/* <span className="grid h-9 w-9 shrink-0 place-items-center text-[#008d8c]">
            <UserRound size={20} strokeWidth={2.2} />
          </span> */}
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

          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#123748]">
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

      {open ? (
        <div
          className="
            fixed inset-0 z-50
            flex items-end justify-center
            bg-[#062b35]/45
            px-4 pb-4
            backdrop-blur-[3px]
            sm:items-center sm:pb-0
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${label}`}
            className="
              w-full max-w-md
              animate-in
              slide-in-from-bottom-5
              rounded-[28px]
              border border-white/80
              bg-white
              p-5
              shadow-[0_30px_80px_rgba(6,43,53,0.25)]
              duration-200
              sm:zoom-in-95
            "
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d8e9e9] sm:hidden" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[18px] font-black text-[#062b35]">
                  Select {label}
                </div>

                <p className="mt-1 text-[13px] leading-5 text-[#65838b]">
                  Choose the role that best matches this member.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close role selection"
                className="
                  grid h-10 w-10 shrink-0
                  place-items-center rounded-full
                  border border-[#d7ebeb]
                  text-[#65838b]
                  transition
                  hover:border-[#008d8c]
                  hover:bg-[#effafa]
                  hover:text-[#008d8c]
                "
              >
                <X size={19} strokeWidth={2.3} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {options.map((option) => {
                const optionLabel = getLabel
                  ? getLabel(option)
                  : option

                const selected = option === value

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      flex w-full items-center
                      rounded-2xl border
                      px-4 py-3.5
                      text-left
                      transition-all duration-200
                      ${
                        selected
                          ? 'border-[#008d8c] bg-[#edfafa] shadow-[0_8px_24px_rgba(0,141,140,0.10)]'
                          : 'border-[#deecec] bg-white hover:border-[#9ed6d4] hover:bg-[#f8fdfd]'
                      }
                    `}
                  >
                    <span
                      className={`
                        grid h-10 w-10 shrink-0
                        place-items-center rounded-xl
                        ${
                          selected
                            ? 'bg-[#008d8c] text-white'
                            : 'bg-[#eef8f8] text-[#008d8c]'
                        }
                      `}
                    >
                      {/* <UserRound size={19} strokeWidth={2.2} /> */}
                      <Grip size={18} strokeWidth={2.2} />
                    </span>

                    <span className="ml-3 min-w-0 flex-1">
                      <span className="block text-[15px] font-black text-[#123748]">
                        {optionLabel}
                      </span>

                      <span className="mt-0.5 block text-[12px] font-medium text-[#789096]">
                        {optionLabel === 'Manager'
                          ? 'Can manage members, meals and expenses'
                          : 'Can view and manage personal activities'}
                      </span>
                    </span>

                    <span
                      className={`
                        ml-3 grid h-7 w-7
                        shrink-0 place-items-center
                        rounded-full border
                        ${
                          selected
                            ? 'border-[#008d8c] bg-[#008d8c] text-white'
                            : 'border-[#c9dfdf] text-transparent'
                        }
                      `}
                    >
                      <Check size={15} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="
                mt-5 h-12 w-full
                rounded-2xl
                bg-[#008d8c]
                text-sm font-black text-white
                shadow-[0_10px_24px_rgba(0,141,140,0.22)]
                transition
                hover:bg-[#007c7c]
                active:scale-[0.99]
              "
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
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
        <div className="text-sm font-bold text-[#123748]">{label}</div>
        {hint ? <div className="mt-1 text-[11px] font-medium text-[#65838b]">{hint}</div> : null}
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
        <div className="text-base font-black text-[#123748]">{title}</div>
        {description ? <div className="mt-1 text-xs text-[#65838b]">{description}</div> : null}
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
