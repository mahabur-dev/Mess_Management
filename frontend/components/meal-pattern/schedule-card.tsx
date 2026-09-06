'use client'

import { CalendarDays, RotateCcw } from 'lucide-react'
import type { MealName, MealPatternSchedule } from '@/lib/api-client'
import { MEAL_PATTERN_MEALS, getScheduleTotal } from '@/lib/meal-pattern'
import { MealQuantityControl } from './meal-quantity-control'

interface ScheduleCardProps {
  title: string
  eyebrow?: string
  description?: string
  schedule: MealPatternSchedule
  onChange: (schedule: MealPatternSchedule) => void
  onClear?: () => void
  compactMeals?: boolean
  iconLabel?: string
}

export function ScheduleCard({
  title,
  eyebrow,
  description,
  schedule,
  onChange,
  onClear,
  compactMeals = false,
  iconLabel,
}: ScheduleCardProps) {
  const total = getScheduleTotal(schedule)
  const setMeal = (meal: MealName, value: number) => onChange({ ...schedule, [meal]: value })

  return (
    <article className="dashboard-card overflow-hidden ring-1 ring-[var(--dashboard-line)]/70">
      <header className="flex items-start gap-3 border-b border-border bg-muted/50 p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] ">
          {iconLabel ? <span className="text-[11px] font-semibold uppercase tracking-tight">{iconLabel}</span> : <CalendarDays className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{eyebrow}</p>}
          <h3 className="font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs font-semibold leading-5 text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-lg bg-[var(--dashboard-surface)] px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[var(--brand-dark)]  dark:text-[var(--brand-bright)]">{total} meals</span>
          {onClear && total > 0 && (
            <button type="button" onClick={onClear} aria-label={`Clear ${title}`} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-[var(--dashboard-surface)] hover:text-[var(--brand)]">
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className={compactMeals ? 'space-y-2 p-3 sm:p-4' : 'grid gap-3 p-4 sm:grid-cols-3 sm:p-5'}>
        {MEAL_PATTERN_MEALS.map((meal) => (
          <MealQuantityControl key={meal} meal={meal} value={schedule[meal]} onChange={(value) => setMeal(meal, value)} compact={compactMeals} />
        ))}
      </div>
    </article>
  )
}
