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
  default: 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)] hover:text-[var(--brand)] dark:border-[var(--dashboard-line)] dark:bg-[var(--dashboard-surface)] dark:text-white/70 dark:hover:text-[var(--brand)]',
  primary: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-dark)] hover:bg-[var(--brand-softer)] hover:text-[var(--brand-dark)] dark:border-[var(--brand-border)] dark:bg-[var(--brand-soft)] dark:text-[var(--brand-bright)] dark:hover:bg-[var(--brand-softer)] dark:hover:text-[var(--brand-bright)]',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive dark:border-destructive/50 dark:bg-destructive/15 dark:text-destructive',
  success: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:border-primary/50 dark:bg-primary/15 dark:text-primary',
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
        'size-9 shrink-0 rounded-lg border  transition focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
