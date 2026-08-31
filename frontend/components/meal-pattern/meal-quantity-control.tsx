'use client'

import { Coffee, Minus, Moon, Plus, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealName } from '@/lib/api-client'
import { MEAL_PATTERN_BASE_VALUE, MEAL_PATTERN_LABELS } from '@/lib/meal-pattern'

const mealIcons = {
  BREAKFAST: Coffee,
  LUNCH: Sun,
  DINNER: Moon,
}

interface MealQuantityControlProps {
  meal: MealName
  value: number
  onChange: (value: number) => void
  compact?: boolean
  disabled?: boolean
}

export function MealQuantityControl({ meal, value, onChange, compact = false, disabled = false }: MealQuantityControlProps) {
  const Icon = mealIcons[meal]
  const step = MEAL_PATTERN_BASE_VALUE[meal]
  const enabled = value > 0
  const setEnabled = (next: boolean) => onChange(next ? step : 0)
  const decrease = () => onChange(Number(Math.max(0, value - step).toFixed(2)))
  const increase = () => onChange(Number(Math.min(20, value + step).toFixed(2)))

  return (
    <div className={cn(
      'group relative flex flex-wrap items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 transition-all',
      enabled
        ? 'border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] shadow-[0_1px_2px_color-mix(in_srgb,var(--brand-dark)_7%,transparent)]'
        : 'border-transparent bg-[var(--dashboard-surface-subtle)]/70',
      compact ? 'min-h-16' : 'min-h-20 sm:px-4',
    )}>
      <span aria-hidden="true" className={cn('absolute inset-y-3 left-0 w-0.5 rounded-r-full transition-colors', enabled ? 'bg-[var(--brand)]' : 'bg-transparent')} />
      <span className={cn(
        'grid shrink-0 place-items-center rounded-lg transition-colors',
        compact ? 'size-9' : 'size-10',
        enabled ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-[var(--dashboard-surface)] text-muted-foreground',
      )}>
        <Icon className={compact ? 'size-4' : 'size-5'} aria-hidden="true" />
      </span>

      <div className="min-w-24 flex-1">
        <p className={cn('font-black text-foreground', compact ? 'text-xs' : 'text-sm')}>{MEAL_PATTERN_LABELS[meal]}</p>
        {!compact && <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Base portion {step}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Turn off' : 'Turn on'} ${MEAL_PATTERN_LABELS[meal]}`}
          disabled={disabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-ring)] disabled:opacity-50',
            enabled ? 'bg-[var(--brand)]' : 'bg-[var(--dashboard-line-strong)]',
          )}
        >
          <span className={cn('absolute left-1 top-1 size-4 rounded-full bg-white shadow transition-transform', enabled ? 'translate-x-4' : 'translate-x-0')} />
        </button>

        {enabled && (
          <div className="flex h-10 items-center rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0.5 shadow-sm">
          <button
            type="button"
            aria-label={`Decrease ${MEAL_PATTERN_LABELS[meal]}`}
            disabled={disabled || value <= 0}
            onClick={decrease}
            className="grid size-8 place-items-center rounded-md text-[var(--brand)] transition hover:bg-[var(--brand-soft)] disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <output aria-label={`${MEAL_PATTERN_LABELS[meal]} quantity`} className="min-w-9 text-center text-sm font-black tabular-nums text-foreground">{value}</output>
          <button
            type="button"
            aria-label={`Increase ${MEAL_PATTERN_LABELS[meal]}`}
            disabled={disabled || value >= 20}
            onClick={increase}
            className="grid size-8 place-items-center rounded-md bg-[var(--brand)] text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
          </div>
        )}
      </div>
    </div>
  )
}
