'use client'

import { useState } from 'react'
import { Copy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MealPatternSchedule, MealPatternType, MealPatternWeekday, MealPatternWeeklySchedule } from '@/lib/api-client'
import {
  EMPTY_MEAL_PATTERN_SCHEDULE,
  MEAL_PATTERN_DAYS,
  MEAL_PATTERN_DAY_LABELS,
  cloneMealPatternSchedule,
  getScheduleTotal,
} from '@/lib/meal-pattern'
import { ScheduleCard } from './schedule-card'

interface ScheduleEditorProps {
  type: MealPatternType
  dailySchedule: MealPatternSchedule
  weeklySchedule: MealPatternWeeklySchedule
  onDailyChange: (schedule: MealPatternSchedule) => void
  onWeeklyChange: (schedule: MealPatternWeeklySchedule) => void
}

export function ScheduleEditor({ type, dailySchedule, weeklySchedule, onDailyChange, onWeeklyChange }: ScheduleEditorProps) {
  const [mobileDay, setMobileDay] = useState<MealPatternWeekday>('SATURDAY')

  if (type === 'DAILY') {
    return (
      <ScheduleCard
        eyebrow="Daily routine"
        title="Every day"
        description="This meal schedule repeats automatically seven days a week."
        schedule={dailySchedule}
        onChange={onDailyChange}
      />
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
        <ScheduleCard
          eyebrow="Selected day"
          title={MEAL_PATTERN_DAY_LABELS[mobileDay]}
          schedule={weeklySchedule[mobileDay]}
          onChange={(schedule) => updateDay(mobileDay, schedule)}
          onClear={() => updateDay(mobileDay, cloneMealPatternSchedule(EMPTY_MEAL_PATTERN_SCHEDULE))}
          compactMeals
          iconLabel={MEAL_PATTERN_DAY_LABELS[mobileDay].slice(0, 2)}
        />
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2 2xl:grid-cols-3">
        {MEAL_PATTERN_DAYS.map((day) => (
          <ScheduleCard
            key={day}
            title={MEAL_PATTERN_DAY_LABELS[day]}
            schedule={weeklySchedule[day]}
            onChange={(schedule) => updateDay(day, schedule)}
            onClear={() => updateDay(day, cloneMealPatternSchedule(EMPTY_MEAL_PATTERN_SCHEDULE))}
            compactMeals
            iconLabel={MEAL_PATTERN_DAY_LABELS[day].slice(0, 2)}
          />
        ))}
      </div>
    </section>
  )
}
