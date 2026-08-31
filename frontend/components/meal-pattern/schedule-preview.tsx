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

function MealPill({ meal, value }: { meal: MealName; value: number }) {
  const Icon = mealIcons[meal]
  const on = value > 0
  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black ${on ? 'bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground opacity-55'}`}>
      <Icon className="size-3.5" />
      <span>{MEAL_PATTERN_LABELS[meal]}</span>
      <span>{on ? value : 'Off'}</span>
    </span>
  )
}

export function SchedulePreview({ pattern, compact = false }: { pattern: MealPattern; compact?: boolean }) {
  if (pattern.pattern_type === 'DAILY') {
    const schedule = normalizeMealPatternSchedule(pattern.daily_schedule)
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {MEAL_PATTERN_MEALS.map((meal) => <MealPill key={meal} meal={meal} value={schedule[meal]} />)}
        </div>
        {!compact && <p className="mt-3 text-xs font-semibold text-muted-foreground">Repeats every day · {getScheduleTotal(schedule)} meals per day</p>}
      </div>
    )
  }

  const weekly = normalizeWeeklyMealPatternSchedule(pattern.weekly_schedule)
  if (compact) {
    const activeDays = MEAL_PATTERN_DAYS.filter((day) => getScheduleTotal(weekly[day]) > 0)
    return (
      <div className="flex flex-wrap gap-1.5">
        {MEAL_PATTERN_DAYS.map((day) => (
          <span key={day} className={`grid size-8 place-items-center rounded-lg text-[10px] font-black ${activeDays.includes(day) ? 'bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground'}`}>
            {MEAL_PATTERN_DAY_LABELS[day].slice(0, 2)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {MEAL_PATTERN_DAYS.map((day) => (
        <div key={day} className="flex flex-col gap-2 rounded-xl bg-[var(--dashboard-surface-subtle)] p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-28 items-center justify-between gap-2 sm:justify-start">
            <span className="text-sm font-black text-foreground">{MEAL_PATTERN_DAY_LABELS[day]}</span>
            <span className="text-xs font-bold text-muted-foreground sm:hidden">{getScheduleTotal(weekly[day])}</span>
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {MEAL_PATTERN_MEALS.filter((meal) => weekly[day][meal] > 0).map((meal) => (
              <span key={meal} className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-[var(--dashboard-surface)] px-2 text-[11px] font-black text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">
                <Check className="size-3" /> {MEAL_PATTERN_LABELS[meal]} {weekly[day][meal]}
              </span>
            ))}
            {getScheduleTotal(weekly[day]) === 0 && <span className="text-xs font-semibold text-muted-foreground">No meals</span>}
          </div>
          <span className="hidden text-xs font-black text-muted-foreground sm:block">{getScheduleTotal(weekly[day])}</span>
        </div>
      ))}
    </div>
  )
}
