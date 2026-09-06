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

  if (compact) {
    return (
      <div className={cn(
        'group relative flex min-h-16 flex-wrap items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 transition-colors',
        enabled
          ? 'border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] '
          : 'border-transparent bg-[var(--dashboard-surface-subtle)]/70',
      )}>
        <span aria-hidden="true" className={cn('absolute inset-y-3 left-0 w-0.5 rounded-r-full transition-colors', enabled ? 'bg-[var(--brand)]' : 'bg-transparent')} />
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg transition-colors', enabled ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-[var(--dashboard-surface)] text-muted-foreground')}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-24 flex-1">
          <p className="text-xs font-semibold text-foreground">{MEAL_PATTERN_LABELS[meal]}</p>
        </div>
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
          <span className={cn('absolute left-1 top-1 size-4 rounded-full bg-background shadow transition-transform', enabled ? 'translate-x-4' : 'translate-x-0')} />
        </button>
        {enabled && (
          <div className="ml-auto flex h-10 items-center rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0.5 ">
            <button type="button" aria-label={`Decrease ${MEAL_PATTERN_LABELS[meal]}`} disabled={disabled || value <= 0} onClick={decrease} className="grid size-8 place-items-center rounded-md text-[var(--brand)] transition hover:bg-[var(--brand-soft)] disabled:opacity-40"><Minus className="size-4" /></button>
            <output aria-label={`${MEAL_PATTERN_LABELS[meal]} quantity`} className="min-w-9 text-center text-sm font-semibold tabular-nums text-foreground">{value}</output>
            <button type="button" aria-label={`Increase ${MEAL_PATTERN_LABELS[meal]}`} disabled={disabled || value >= 20} onClick={increase} className="grid size-8 place-items-center rounded-md bg-[var(--brand)] text-primary-foreground transition hover:bg-[var(--brand-hover)] disabled:opacity-40"><Plus className="size-4" /></button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'group relative flex h-[8.25rem] flex-col overflow-hidden rounded-2xl border p-4 transition-colors',
      enabled
        ? 'border-border bg-muted/50 '
        : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]/70',
    )}>
      <span aria-hidden="true" className={cn('absolute inset-y-4 left-0 w-0.5 rounded-r-full transition-colors', enabled ? 'bg-[var(--brand)]' : 'bg-transparent')} />

      <div className="flex min-w-0 items-center gap-3">
        <span className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl border transition-colors',
          enabled
            ? 'border-[var(--brand-border-subtle)] bg-[var(--brand-soft)] text-[var(--brand)]'
            : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground',
        )}>
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[var(--dashboard-ink)]">{MEAL_PATTERN_LABELS[meal]}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">Base portion {step}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Turn off' : 'Turn on'} ${MEAL_PATTERN_LABELS[meal]}`}
          disabled={disabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative h-6 w-10 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-ring)] disabled:opacity-50',
            enabled
              ? 'border-transparent bg-[var(--brand)]'
              : 'border-[var(--dashboard-line-strong)] bg-[var(--dashboard-surface)]',
          )}
        >
          <span className={cn('absolute left-[3px] top-[3px] size-4 rounded-full bg-background  transition-transform', enabled ? 'translate-x-4' : 'translate-x-0')} />
        </button>
      </div>

      <div className="mt-auto flex h-10 items-center justify-between gap-3">
        <span className={cn(
          'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:hidden xl:inline-flex',
          enabled ? 'text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'text-muted-foreground',
        )}>
          <span className={cn('size-1.5 rounded-full', enabled ? 'bg-[var(--brand)]' : 'bg-[var(--dashboard-line-strong)]')} />
          {enabled ? 'Active' : 'Not included'}
        </span>
        <div className={cn(
          'flex h-10 shrink-0 items-center rounded-xl border bg-[var(--dashboard-surface)] p-0.5  transition-opacity',
          enabled ? 'border-[var(--dashboard-line)] opacity-100' : 'pointer-events-none border-[var(--dashboard-line)] opacity-45',
        )}>
          <button
            type="button"
            aria-label={`Decrease ${MEAL_PATTERN_LABELS[meal]}`}
            disabled={disabled || !enabled || value <= 0}
            onClick={decrease}
            className="grid size-8 place-items-center rounded-md text-[var(--brand)] transition hover:bg-[var(--brand-soft)] disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <output aria-label={`${MEAL_PATTERN_LABELS[meal]} quantity`} className="min-w-9 text-center text-sm font-semibold tabular-nums text-foreground">{value}</output>
          <button
            type="button"
            aria-label={`Increase ${MEAL_PATTERN_LABELS[meal]}`}
            disabled={disabled || !enabled || value >= 20}
            onClick={increase}
            className="grid size-8 place-items-center rounded-md bg-[var(--brand)] text-primary-foreground transition hover:bg-[var(--brand-hover)] disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
