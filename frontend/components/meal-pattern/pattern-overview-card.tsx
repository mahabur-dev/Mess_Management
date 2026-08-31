'use client'

import { ArrowRight, CalendarClock, CalendarRange, History, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MealPattern } from '@/lib/api-client'
import { formatPatternDate, getPatternWeeklyTotal, isPatternConfigurable } from '@/lib/meal-pattern'
import { PatternStatusBadge } from './pattern-status-badge'
import { SchedulePreview } from './schedule-preview'

interface PatternOverviewCardProps {
  pattern: MealPattern | null
  memberName?: string
  onSetup: () => void
  onView?: () => void
}

export function PatternOverviewCard({ pattern, memberName, onSetup, onView }: PatternOverviewCardProps) {
  if (!pattern) {
    return (
      <section className="dashboard-card relative overflow-hidden p-5 sm:p-7">
        <div className="absolute -right-14 -top-14 size-44 rounded-full bg-[var(--brand)]/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] shadow-[0_10px_24px_var(--brand-shadow)]">
            <CalendarClock className="size-7" />
          </span>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--brand)]">Meal automation</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Set your routine once</h2>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-muted-foreground">
            Choose the meals you normally take. Messzen will add them automatically, and you can still change an individual meal later.
          </p>
          <Button onClick={onSetup} className="mt-6 min-h-12 w-full rounded-xl bg-[var(--brand)] px-5 font-black text-white shadow-[0_12px_26px_var(--brand-shadow)] hover:bg-[var(--brand-hover)] sm:w-auto">
            Set my meal pattern <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="border-b border-[var(--dashboard-line)] bg-[linear-gradient(135deg,var(--brand-softer),var(--dashboard-surface))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Sparkles className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--brand)]">{memberName ? `${memberName}'s schedule` : 'Your automatic schedule'}</p>
              <h2 className="mt-1 text-xl font-black text-foreground sm:text-2xl">{pattern.pattern_type === 'DAILY' ? 'Same meals every day' : 'Different meals by day'}</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Version {pattern.version} · {getPatternWeeklyTotal(pattern)} meals each week</p>
            </div>
          </div>
          <PatternStatusBadge status={pattern.status} className="self-start" />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <SchedulePreview pattern={pattern} />

        <div className="mt-5 grid gap-3 rounded-2xl bg-[var(--dashboard-surface-subtle)] p-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <CalendarRange className="size-5 shrink-0 text-[var(--brand)]" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Starts</p>
              <p className="text-sm font-black text-foreground">{formatPatternDate(pattern.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarClock className="size-5 shrink-0 text-[var(--brand)]" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Runs until</p>
              <p className="text-sm font-black text-foreground">{pattern.end_date ? formatPatternDate(pattern.end_date) : 'You stop it'}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onSetup} className="min-h-11 rounded-xl bg-[var(--brand)] px-5 font-black text-white hover:bg-[var(--brand-hover)]">
            {isPatternConfigurable(pattern) ? 'Change pattern' : 'Set a new pattern'} <ArrowRight className="size-4" />
          </Button>
          {onView && (
            <Button onClick={onView} variant="outline" className="min-h-11 rounded-xl px-5 font-black">
              <History className="size-4" /> Details & history
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
