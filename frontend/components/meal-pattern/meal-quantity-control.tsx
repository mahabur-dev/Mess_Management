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
      'rounded-2xl border transition-colors',
      enabled
        ? 'border-[var(--brand-border)] bg-[var(--brand-softer)] dark:bg-[var(--brand)]/5'
        : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]',
      compact ? 'p-2.5' : 'p-4',
    )}>
      <div className="flex items-center gap-3">
        <span className={cn(
          'grid shrink-0 place-items-center rounded-xl transition-colors',
          compact ? 'size-9' : 'size-11',
          enabled ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground',
        )}>
          <Icon className={compact ? 'size-4' : 'size-5'} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn('font-black text-foreground', compact ? 'text-xs' : 'text-sm')}>{MEAL_PATTERN_LABELS[meal]}</p>
          {!compact && <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{meal === 'BREAKFAST' ? '0.5 meal per person' : '1 meal per person'}</p>}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Turn off' : 'Turn on'} ${MEAL_PATTERN_LABELS[meal]}`}
          disabled={disabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-ring)] disabled:opacity-50',
            enabled ? 'bg-[var(--brand)]' : 'bg-[var(--dashboard-line-strong)]',
          )}
        >
          <span className={cn('absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform', enabled ? 'translate-x-5' : 'translate-x-0')} />
        </button>
      </div>

      {enabled && (
        <div className={cn('flex items-center justify-between rounded-xl bg-[var(--dashboard-surface)]', compact ? 'mt-2 p-1' : 'mt-4 p-1.5')}>
          <button
            type="button"
            aria-label={`Decrease ${MEAL_PATTERN_LABELS[meal]}`}
            disabled={disabled || value <= 0}
            onClick={decrease}
            className="grid size-10 place-items-center rounded-lg text-[var(--brand)] transition hover:bg-[var(--brand-soft)] disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <div className="text-center">
            <p className={cn('font-black tabular-nums text-foreground', compact ? 'text-lg' : 'text-2xl')}>{value}</p>
            {!compact && <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">meal count</p>}
          </div>
          <button
            type="button"
            aria-label={`Increase ${MEAL_PATTERN_LABELS[meal]}`}
            disabled={disabled || value >= 20}
            onClick={increase}
            className="grid size-10 place-items-center rounded-lg bg-[var(--brand)] text-white shadow-[0_7px_16px_var(--brand-shadow)] transition hover:bg-[var(--brand-hover)] disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
