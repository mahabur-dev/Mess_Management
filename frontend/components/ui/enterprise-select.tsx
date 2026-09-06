'use client'

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
  className,
  contentClassName,
}: EnterpriseSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'h-12 min-h-12 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-softer)] px-4 text-sm font-semibold text-[var(--dashboard-ink)] outline-none transition-colors hover:bg-[var(--brand-soft)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-ring)] dark:bg-[var(--brand-softer)] dark:text-white dark:hover:bg-[var(--brand-soft)]',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={cn(
          'dashboard-portal-surface z-[100] max-h-72 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-1.5',
          contentClassName,
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="my-0.5 min-h-10 rounded-lg px-3 text-sm font-semibold text-[var(--dashboard-ink)] focus:bg-[var(--brand-soft)] focus:text-[var(--brand-dark)] dark:text-white dark:focus:text-[var(--brand-bright)]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
