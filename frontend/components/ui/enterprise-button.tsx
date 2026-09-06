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
  primary: 'border-transparent bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] hover:text-white dark:border-transparent dark:bg-[var(--brand)] dark:text-white dark:hover:bg-[var(--brand-hover)]',
  secondary: 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)] hover:text-[var(--dashboard-ink)] dark:border-[var(--dashboard-line)] dark:bg-[var(--dashboard-surface)] dark:text-white dark:hover:border-[var(--brand-border)] dark:hover:bg-[var(--dashboard-hover)] dark:hover:text-white',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive dark:border-destructive/50 dark:bg-destructive/15 dark:text-destructive dark:hover:bg-destructive/20',
  success: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:border-primary/50 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20',
  warning: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:border-primary/50 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20',
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
        'rounded-lg border font-semibold transition-colors focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-50',
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
