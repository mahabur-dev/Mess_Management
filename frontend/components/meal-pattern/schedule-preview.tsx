import { Check, Coffee, Moon, Sun } from 'lucide-react'
import type { MealName, MealPattern } from '@/lib/api-client'
import {
  MEAL_PATTERN_DAYS,
  MEAL_PATTERN_DAY_LABELS,
  MEAL_PATTERN_LABELS,
  MEAL_PATTERN_MEALS,
  getScheduleTotal,
  normalizeMealPatternSchedule,
  normalizeWeeklyMealPatternSchedule,
} from '@/lib/meal-pattern'

const mealIcons = { BREAKFAST: Coffee, LUNCH: Sun, DINNER: Moon }

function MealSummary({ meal, value, compact = false }: { meal: MealName; value: number; compact?: boolean }) {
  const Icon = mealIcons[meal]
  const enabled = value > 0

  if (compact) {
    return (
      <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ${enabled ? 'bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground opacity-60'}`}>
        <Icon className="size-3.5" />
        <span>{MEAL_PATTERN_LABELS[meal]}</span>
        <span className="tabular-nums">{enabled ? value : 'Off'}</span>
      </span>
    )
  }

  return (
    <div className={`rounded-xl border p-3 ${enabled ? 'border-[var(--brand-border-subtle)] bg-[var(--brand-softer)]' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]/60'}`}>
      <div className="flex items-center gap-2">
        <span className={`grid size-8 place-items-center rounded-lg ${enabled ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-[var(--dashboard-surface)] text-muted-foreground'}`}><Icon className="size-4" /></span>
        <span className="text-xs font-semibold text-foreground">{MEAL_PATTERN_LABELS[meal]}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className={`text-xl font-semibold tabular-nums ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{enabled ? value : '—'}</span>
        <span className="pb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{enabled ? 'meals' : 'off'}</span>
      </div>
    </div>
  )
}

export function SchedulePreview({ pattern, compact = false }: { pattern: MealPattern; compact?: boolean }) {
  if (pattern.pattern_type === 'DAILY') {
    const schedule = normalizeMealPatternSchedule(pattern.daily_schedule)

    if (compact) {
      return <div className="flex flex-wrap gap-2">{MEAL_PATTERN_MEALS.map((meal) => <MealSummary key={meal} meal={meal} value={schedule[meal]} compact />)}</div>
    }

    return (
      <div>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_PATTERN_MEALS.map((meal) => <MealSummary key={meal} meal={meal} value={schedule[meal]} />)}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--dashboard-surface-subtle)] px-3 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">Repeats every day</span>
          <span className="text-xs font-semibold tabular-nums text-foreground">{getScheduleTotal(schedule)} meals / day</span>
        </div>
      </div>
    )
  }

  const weekly = normalizeWeeklyMealPatternSchedule(pattern.weekly_schedule)
  if (compact) {
    const activeDays = MEAL_PATTERN_DAYS.filter((day) => getScheduleTotal(weekly[day]) > 0)
    return (
      <div className="flex flex-wrap gap-1.5">
        {MEAL_PATTERN_DAYS.map((day) => (
          <span key={day} className={`grid size-8 place-items-center rounded-lg text-[10px] font-semibold ${activeDays.includes(day) ? 'bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground'}`}>
            {MEAL_PATTERN_DAY_LABELS[day].slice(0, 2)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
      <div className="hidden grid-cols-[7rem_minmax(0,1fr)_3rem] gap-3 border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-3 py-2 sm:grid">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Day</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled meals</span>
        <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
      </div>
      {MEAL_PATTERN_DAYS.map((day) => (
        <div key={day} className="border-b border-[var(--dashboard-line)] p-3 last:border-0 sm:grid sm:grid-cols-[7rem_minmax(0,1fr)_3rem] sm:items-center sm:gap-3">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-0">
            <span className="text-xs font-semibold text-foreground">{MEAL_PATTERN_DAY_LABELS[day]}</span>
            <span className="rounded-md bg-[var(--dashboard-surface-subtle)] px-2 py-1 text-[10px] font-semibold tabular-nums text-muted-foreground sm:hidden">{getScheduleTotal(weekly[day])}</span>
          </div>
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {MEAL_PATTERN_MEALS.filter((meal) => weekly[day][meal] > 0).map((meal) => (
              <span key={meal} className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-[var(--brand-soft)] px-2 text-[10px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">
                <Check className="size-3" /> {MEAL_PATTERN_LABELS[meal]} <span className="tabular-nums">{weekly[day][meal]}</span>
              </span>
            ))}
            {getScheduleTotal(weekly[day]) === 0 && <span className="text-xs font-semibold text-muted-foreground">No meals</span>}
          </div>
          <span className="hidden text-right text-xs font-semibold tabular-nums text-foreground sm:block">{getScheduleTotal(weekly[day])}</span>
        </div>
      ))}
    </div>
  )
}
