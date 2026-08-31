'use client'

import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EnterpriseButtonTone = 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
type EnterpriseButtonSize = 'sm' | 'md' | 'lg'

interface EnterpriseButtonProps extends Omit<ComponentProps<typeof Button>, 'children' | 'size' | 'variant'> {
  children: ReactNode
  tone?: EnterpriseButtonTone
  size?: EnterpriseButtonSize
  fullWidth?: boolean
}

const toneClasses: Record<EnterpriseButtonTone, string> = {
  primary: 'border-transparent bg-[var(--brand)] text-white shadow-[0_8px_20px_var(--brand-shadow)] hover:bg-[var(--brand-hover)]',
  secondary: 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] shadow-sm hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)]',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100',
}

const sizeClasses: Record<EnterpriseButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

/** Shared action button for consistent enterprise controls across dashboard screens. */
export function EnterpriseButton({
  children,
  tone = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: EnterpriseButtonProps) {
  return (
    <Button
      type={type}
      variant="outline"
      className={cn(
        'rounded-xl border font-black transition focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
        toneClasses[tone],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
