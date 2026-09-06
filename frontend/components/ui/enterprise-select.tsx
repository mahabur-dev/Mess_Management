'use client'

import type { ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface EnterpriseSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface EnterpriseSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: EnterpriseSelectOption[]
  placeholder?: string
  disabled?: boolean
  icon?: ReactNode
  ariaLabel?: string
  align?: 'start' | 'center' | 'end'
  className?: string
  contentClassName?: string
}

/** Shared, portal-based select that keeps menus aligned inside drawers and forms. */
export function EnterpriseSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  icon,
  ariaLabel,
  align = 'start',
  className,
  contentClassName,
}: EnterpriseSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          'h-11 min-h-11 w-full rounded-lg border border-[var(--brand-border)] bg-[var(--dashboard-surface)] px-3.5 text-sm font-medium text-[var(--dashboard-ink)] shadow-none outline-none transition-colors hover:bg-[var(--brand-softer)] focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand-ring)] disabled:opacity-60 dark:bg-[var(--dashboard-surface)] dark:text-white dark:hover:bg-[var(--brand-softer)]',
          className,
        )}
      >
        {icon ? <span className="shrink-0 text-[var(--brand)]">{icon}</span> : null}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align={align}
        collisionPadding={16}
        className={cn(
          'dashboard-portal-surface z-[100] max-h-72 min-w-[var(--radix-select-trigger-width)] rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-1',
          contentClassName,
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="my-0.5 min-h-10 rounded-md px-3 text-sm font-medium text-[var(--dashboard-ink)] focus:bg-[var(--brand-soft)] focus:text-[var(--brand-dark)] dark:text-white dark:focus:text-[var(--brand-bright)]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
