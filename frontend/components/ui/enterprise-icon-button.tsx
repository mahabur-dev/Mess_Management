'use client'

import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EnterpriseIconButtonTone = 'default' | 'primary' | 'danger' | 'success'

interface EnterpriseIconButtonProps
  extends Omit<ComponentProps<typeof Button>, 'children' | 'size' | 'variant'> {
  label: string
  children: ReactNode
  tone?: EnterpriseIconButtonTone
}

const toneClasses: Record<EnterpriseIconButtonTone, string> = {
  default: 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)] hover:text-[var(--brand)]',
  primary: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-dark)] hover:bg-[var(--brand-softer)]',
  danger: 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

/** A shared, accessible icon action for tables, cards, and drawer footers. */
export function EnterpriseIconButton({
  label,
  children,
  tone = 'default',
  className,
  type = 'button',
  ...props
}: EnterpriseIconButtonProps) {
  return (
    <Button
      type={type}
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      className={cn(
        'size-9 shrink-0 rounded-xl border shadow-sm transition focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
