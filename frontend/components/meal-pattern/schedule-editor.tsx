'use client'

import { useState } from 'react'
import { CalendarDays, Copy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MealName, MealPatternSchedule, MealPatternType, MealPatternWeekday, MealPatternWeeklySchedule } from '@/lib/api-client'
import {
  EMPTY_MEAL_PATTERN_SCHEDULE,
  MEAL_PATTERN_DAYS,
  MEAL_PATTERN_DAY_LABELS,
  MEAL_PATTERN_MEALS,
  cloneMealPatternSchedule,
  getScheduleTotal,
} from '@/lib/meal-pattern'
import { MealQuantityControl } from './meal-quantity-control'

interface ScheduleEditorProps {
  type: MealPatternType
  dailySchedule: MealPatternSchedule
  weeklySchedule: MealPatternWeeklySchedule
  onDailyChange: (schedule: MealPatternSchedule) => void
  onWeeklyChange: (schedule: MealPatternWeeklySchedule) => void
}

function ScheduleFields({ schedule, onChange, compact = false }: {
  schedule: MealPatternSchedule
  onChange: (schedule: MealPatternSchedule) => void
  compact?: boolean
}) {
  const setMeal = (meal: MealName, value: number) => onChange({ ...schedule, [meal]: value })
  return (
    <div className={compact ? 'space-y-2' : 'grid gap-3 md:grid-cols-3'}>
      {MEAL_PATTERN_MEALS.map((meal) => (
        <MealQuantityControl
          key={meal}
          meal={meal}
          value={schedule[meal]}
          onChange={(value) => setMeal(meal, value)}
          compact={compact}
        />
      ))}
    </div>
  )
}

export function ScheduleEditor({ type, dailySchedule, weeklySchedule, onDailyChange, onWeeklyChange }: ScheduleEditorProps) {
  const [mobileDay, setMobileDay] = useState<MealPatternWeekday>('SATURDAY')

  if (type === 'DAILY') {
    return (
      <section className="dashboard-card p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="dashboard-eyebrow text-[10px]">Every day</p>
            <h2 className="mt-1 text-lg font-black text-foreground">Choose your regular meals</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">This schedule will repeat automatically every day.</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-black text-[var(--brand-dark)]">
            {getScheduleTotal(dailySchedule)} / day
          </span>
        </div>
        <ScheduleFields schedule={dailySchedule} onChange={onDailyChange} />
      </section>
    )
  }

  const updateDay = (day: MealPatternWeekday, schedule: MealPatternSchedule) => {
    onWeeklyChange({ ...weeklySchedule, [day]: schedule })
  }
  const copySaturdayToAll = () => {
    const source = weeklySchedule.SATURDAY
    onWeeklyChange(MEAL_PATTERN_DAYS.reduce((result, day) => {
      result[day] = cloneMealPatternSchedule(source)
      return result
    }, {} as MealPatternWeeklySchedule))
  }
  const clearAll = () => {
    onWeeklyChange(MEAL_PATTERN_DAYS.reduce((result, day) => {
      result[day] = cloneMealPatternSchedule(EMPTY_MEAL_PATTERN_SCHEDULE)
      return result
    }, {} as MealPatternWeeklySchedule))
  }

  return (
    <section>
      <div className="dashboard-card mb-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="dashboard-eyebrow text-[10px]">Weekly routine</p>
            <h2 className="mt-1 text-lg font-black text-foreground">Plan each day</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Days left empty will stay meal-free.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copySaturdayToAll} className="min-h-11 rounded-xl font-bold">
              <Copy className="size-4" /> Copy Saturday to all
            </Button>
            <Button type="button" variant="ghost" onClick={clearAll} className="min-h-11 rounded-xl font-bold text-muted-foreground">
              <RotateCcw className="size-4" /> Clear all
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MEAL_PATTERN_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setMobileDay(day)}
              className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-black transition ${mobileDay === day ? 'bg-[var(--brand)] text-white shadow-[0_8px_18px_var(--brand-shadow)]' : 'bg-[var(--dashboard-surface)] text-muted-foreground'}`}
            >
              {MEAL_PATTERN_DAY_LABELS[day].slice(0, 3)} · {getScheduleTotal(weeklySchedule[day])}
            </button>
          ))}
        </div>
        <div className="dashboard-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--brand)]" />
              <h3 className="font-black text-foreground">{MEAL_PATTERN_DAY_LABELS[mobileDay]}</h3>
            </div>
            <button type="button" onClick={() => updateDay(mobileDay, cloneMealPatternSchedule(EMPTY_MEAL_PATTERN_SCHEDULE))} className="min-h-9 text-xs font-bold text-muted-foreground">Clear day</button>
          </div>
          <ScheduleFields schedule={weeklySchedule[mobileDay]} onChange={(schedule) => updateDay(mobileDay, schedule)} />
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2 2xl:grid-cols-3">
        {MEAL_PATTERN_DAYS.map((day) => (
          <article key={day} className="dashboard-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-foreground">{MEAL_PATTERN_DAY_LABELS[day]}</h3>
                <p className="text-xs font-semibold text-muted-foreground">{getScheduleTotal(weeklySchedule[day])} meals</p>
              </div>
              <button type="button" onClick={() => updateDay(day, cloneMealPatternSchedule(EMPTY_MEAL_PATTERN_SCHEDULE))} className="min-h-9 rounded-lg px-2 text-xs font-bold text-muted-foreground hover:bg-[var(--dashboard-surface-subtle)]">Clear</button>
            </div>
            <ScheduleFields compact schedule={weeklySchedule[day]} onChange={(schedule) => updateDay(day, schedule)} />
          </article>
        ))}
      </div>
    </section>
  )
}
