import { CircleCheck, CircleDashed, CirclePause, CircleStop } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealPatternStatus } from '@/lib/api-client'
import { MEAL_PATTERN_STATUS_LABELS } from '@/lib/meal-pattern'

const styles: Record<MealPatternStatus, string> = {
  ACTIVE: 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary',
  PAUSED: 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary',
  DRAFT: 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary',
  ENDED: 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground',
  CANCELLED: 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive',
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
