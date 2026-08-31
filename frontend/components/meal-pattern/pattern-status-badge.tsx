import { CircleCheck, CircleDashed, CirclePause, CircleStop } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealPatternStatus } from '@/lib/api-client'
import { MEAL_PATTERN_STATUS_LABELS } from '@/lib/meal-pattern'

const styles: Record<MealPatternStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  DRAFT: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  ENDED: 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
}

const icons = {
  ACTIVE: CircleCheck,
  PAUSED: CirclePause,
  DRAFT: CircleDashed,
  ENDED: CircleStop,
  CANCELLED: CircleStop,
}

export function PatternStatusBadge({ status, className }: { status: MealPatternStatus; className?: string }) {
  const Icon = icons[status]
  return (
    <span className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', styles[status], className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {MEAL_PATTERN_STATUS_LABELS[status]}
    </span>
  )
}
