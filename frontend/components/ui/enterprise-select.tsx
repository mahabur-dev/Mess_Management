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
          'h-12 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-4 text-sm font-semibold text-[var(--dashboard-ink)] shadow-sm outline-none transition hover:border-[var(--brand-border)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-ring)]',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={cn(
          'z-[100] max-h-72 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-1.5 shadow-[0_20px_45px_color-mix(in_srgb,var(--dashboard-ink)_18%,transparent)]',
          contentClassName,
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-[var(--dashboard-ink)] focus:bg-[var(--brand-soft)] focus:text-[var(--brand-dark)]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
