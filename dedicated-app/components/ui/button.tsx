'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  busy = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  busy?: boolean
}) {
  const variantClass = {
    primary: 'ui-btn--primary',
    secondary: 'ui-btn--secondary',
    ghost: 'ui-btn--ghost',
    danger: 'ui-btn--danger',
  }[variant]

  const sizeClass = size === 'sm' ? 'ui-btn--sm' : ''

  return (
    <button
      {...props}
      className={`ui-btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={busy || props.disabled}
      aria-busy={busy || undefined}
    >
      {busy ? 'Saving...' : children}
    </button>
  )
}

export function IconButton({
  children,
  label,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#008d8c]/10 text-[#008d8c] transition active:scale-95 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
