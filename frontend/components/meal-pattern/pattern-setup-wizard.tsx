'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck2, CalendarDays, Check, CircleCheck, Clock3, Loader2, Repeat2, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  CreateMealPatternInput,
  MealPattern,
  MealPatternSchedule,
  MealPatternType,
  MealPatternWeeklySchedule,
} from '@/lib/api-client'
import {
  DEFAULT_MEAL_PATTERN_SCHEDULE,
  createWeeklyMealPatternSchedule,
  getDhakaDateKey,
  getPatternWeeklyTotal,
  getScheduleTotal,
  normalizeMealPatternSchedule,
  normalizeWeeklyMealPatternSchedule,
} from '@/lib/meal-pattern'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/app/context/sidebar-context'
import { ScheduleEditor } from './schedule-editor'
import { SchedulePreview } from './schedule-preview'

interface PatternSetupWizardProps {
  membershipId: string
  memberName: string
  initialPattern?: MealPattern | null
  saving: boolean
  onSubmit: (payload: CreateMealPatternInput, activate: boolean) => Promise<void>
}

const steps = [
  { number: 1, label: 'Routine' },
  { number: 2, label: 'Meals' },
  { number: 3, label: 'Review' },
]

function shiftDateKey(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function ChoiceCard({ selected, icon: Icon, title, description, bullets, onClick }: {
  selected: boolean
  icon: typeof Repeat2
  title: string
  description: string
  bullets: string[]
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'relative min-h-60 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-ring)]',
        selected
          ? 'border-[var(--brand)] bg-[var(--brand-softer)] shadow-[0_16px_36px_var(--brand-shadow)]'
          : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] hover:border-[var(--brand-border)] hover:shadow-[var(--dashboard-shadow)]',
      )}
    >
      <span className={cn('grid size-12 place-items-center rounded-2xl', selected ? 'bg-[var(--brand)] text-white' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}>
        <Icon className="size-6" />
      </span>
      <span className="mt-5 block text-lg font-semibold text-foreground">{title}</span>
      <span className="mt-1 block text-sm font-semibold leading-6 text-muted-foreground">{description}</span>
      <span className="mt-4 block space-y-2">
        {bullets.map((bullet) => <span key={bullet} className="flex items-center gap-2 text-xs font-bold text-foreground"><Check className="size-3.5 text-[var(--brand)]" /> {bullet}</span>)}
      </span>
      <span className={cn('absolute right-4 top-4 grid size-6 place-items-center rounded-full border', selected ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[var(--dashboard-line-strong)]')}>
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  )
}

export function PatternSetupWizard({ membershipId, memberName, initialPattern, saving, onSubmit }: PatternSetupWizardProps) {
  const { collapsed } = useSidebar()
  const today = useMemo(() => getDhakaDateKey(), [])
  const [step, setStep] = useState(1)
  const [patternType, setPatternType] = useState<MealPatternType>('DAILY')
  const [dailySchedule, setDailySchedule] = useState<MealPatternSchedule>({ ...DEFAULT_MEAL_PATTERN_SCHEDULE })
  const [weeklySchedule, setWeeklySchedule] = useState<MealPatternWeeklySchedule>(() => createWeeklyMealPatternSchedule())
  const [startDate, setStartDate] = useState(today)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [hydratedPatternId, setHydratedPatternId] = useState<string | null>(null)

  useEffect(() => {
    if (!initialPattern || hydratedPatternId === initialPattern.id) return
    setPatternType(initialPattern.pattern_type)
    setDailySchedule(normalizeMealPatternSchedule(initialPattern.daily_schedule))
    setWeeklySchedule(normalizeWeeklyMealPatternSchedule(initialPattern.weekly_schedule))
    const existingStartDate = initialPattern.start_date.slice(0, 10)
    setStartDate(existingStartDate > today ? existingStartDate : today)
    const usableEndDate = initialPattern.end_date?.slice(0, 10)
    setHasEndDate(Boolean(usableEndDate && usableEndDate >= today))
    setEndDate(usableEndDate && usableEndDate >= today ? usableEndDate : '')
    setHydratedPatternId(initialPattern.id)
  }, [hydratedPatternId, initialPattern, today])

  const selectedTotal = patternType === 'DAILY'
    ? getScheduleTotal(dailySchedule)
    : getPatternWeeklyTotal({ pattern_type: 'WEEKLY', weekly_schedule: weeklySchedule } as MealPattern)

  const previewPattern = {
    pattern_type: patternType,
    daily_schedule: patternType === 'DAILY' ? dailySchedule : null,
    weekly_schedule: patternType === 'WEEKLY' ? weeklySchedule : null,
  } as MealPattern
  const endDateLocked = Boolean(initialPattern?.end_date && initialPattern.status !== 'ACTIVE')

  const continueTo = (nextStep: number) => {
    setError('')
    if (step === 2 && selectedTotal <= 0) {
      setError('Choose at least one meal before continuing.')
      return
    }
    setStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (activate: boolean) => {
    setError('')
    if (!membershipId) return setError('Member information is missing. Return to schedules and open this setup again.')
    if (selectedTotal <= 0) return setError('Choose at least one meal before saving.')
    if (!startDate) return setError('Choose when this pattern should start.')
    if (hasEndDate && (!endDate || endDate < startDate)) return setError('The end date must be on or after the start date.')

    await onSubmit({
      membershipId,
      patternType,
      ...(patternType === 'DAILY' ? { dailySchedule } : { weeklySchedule }),
      startDate,
      ...(hasEndDate && endDate ? { endDate } : {}),
      activate,
    }, activate)
  }

  return (
    <div className="mx-auto max-w-6xl pb-28">
      <div className="mb-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex min-w-[420px] max-w-2xl items-center justify-center">
          {steps.map((item, index) => (
            <div key={item.number} className="flex items-center">
              <button type="button" onClick={() => item.number < step && continueTo(item.number)} disabled={item.number > step} className="flex min-h-11 items-center gap-2 rounded-xl px-2 disabled:cursor-default">
                <span className={cn('grid size-8 place-items-center rounded-full text-xs font-semibold', step >= item.number ? 'bg-[var(--brand)] text-white' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}>{step > item.number ? <Check className="size-4" /> : item.number}</span>
                <span className={cn('text-xs font-semibold', step >= item.number ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
              </button>
              {index < steps.length - 1 && <span className={cn('mx-1 h-0.5 w-10 sm:w-20', step > item.number ? 'bg-[var(--brand)]' : 'bg-[var(--dashboard-line-strong)]')} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-softer)] p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Sparkles className="size-5" /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Setting up for</p>
          <p className="truncate text-sm font-semibold text-foreground">{memberName}</p>
        </div>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">{error}</div>}

      {step === 1 && (
        <section>
          <div className="mb-5 text-center sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">Step 1 of 3</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">How does the meal routine work?</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">Choose the option that feels closest. You can change it later.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ChoiceCard selected={patternType === 'DAILY'} icon={Repeat2} title="Same every day" description="Use one simple schedule for all seven days." bullets={['Fastest to set up', 'Best for a regular routine']} onClick={() => setPatternType('DAILY')} />
            <ChoiceCard selected={patternType === 'WEEKLY'} icon={CalendarCheck2} title="Different by day" description="Choose separate meals for each day of the week." bullets={['Flexible weekly planning', 'Keep any day meal-free']} onClick={() => setPatternType('WEEKLY')} />
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">Step 2 of 3</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Choose the meals</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">Turn meals on or off and adjust the quantity only when needed.</p>
          </div>
          <ScheduleEditor type={patternType} dailySchedule={dailySchedule} weeklySchedule={weeklySchedule} onDailyChange={setDailySchedule} onWeeklyChange={setWeeklySchedule} />
        </section>
      )}

      {step === 3 && (
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">Step 3 of 3</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Choose when it starts</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">Review everything before the pattern is saved.</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-5">
              <section className="dashboard-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><CalendarDays className="size-5" /></span>
                  <div><h2 className="font-semibold text-foreground">Start date</h2><p className="text-xs font-semibold text-muted-foreground">When should automation begin?</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setStartDate(today)} className={cn('min-h-11 rounded-xl border text-sm font-semibold', startDate === today ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}>Today</button>
                  <button type="button" onClick={() => setStartDate(shiftDateKey(today, 1))} className={cn('min-h-11 rounded-xl border text-sm font-semibold', startDate === shiftDateKey(today, 1) ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}>Tomorrow</button>
                </div>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Or choose a date</span>
                  <input type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-3 text-sm font-semibold text-foreground outline-none focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand-ring)]" />
                </label>
              </section>

              <section className="dashboard-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Clock3 className="size-5" /></span>
                  <div><h2 className="font-semibold text-foreground">How long?</h2><p className="text-xs font-semibold text-muted-foreground">It can continue until you stop it.</p></div>
                </div>
                <div className="space-y-2">
                  <button type="button" disabled={endDateLocked} onClick={() => setHasEndDate(false)} className={cn('flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45', !hasEndDate ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}><span>Continue until I stop it</span>{!hasEndDate && <CircleCheck className="size-4" />}</button>
                  <button type="button" onClick={() => { setHasEndDate(true); if (!endDate) setEndDate(shiftDateKey(startDate || today, 30)) }} className={cn('flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold', hasEndDate ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}><span>End on a date</span>{hasEndDate && <CircleCheck className="size-4" />}</button>
                </div>
                {endDateLocked && <p className="mt-3 text-xs font-semibold leading-5 text-muted-foreground">This pattern keeps its current end date. You can choose a different end date below.</p>}
                {hasEndDate && <label className="mt-3 block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">End date</span><input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-3 text-sm font-semibold text-foreground outline-none focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand-ring)]" /></label>}
              </section>
            </div>

            <section className="dashboard-card p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Final review</p><h2 className="mt-1 text-xl font-semibold text-foreground">{patternType === 'DAILY' ? 'Same meals every day' : 'Weekly meal routine'}</h2></div>
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">{patternType === 'DAILY' ? `${selectedTotal} / day` : `${selectedTotal} / week`}</span>
              </div>
              <SchedulePreview pattern={previewPattern} />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Starts</p><p className="mt-1 text-xs font-semibold text-foreground">{startDate}</p></div>
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ends</p><p className="mt-1 text-xs font-semibold text-foreground">{hasEndDate ? endDate || 'Choose date' : 'When you stop it'}</p></div>
              </div>
              <div className="mt-5 flex gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-softer)] p-4">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-[var(--brand)]" />
                <p className="text-xs font-semibold leading-5 text-foreground">Automatic meals follow this routine. A meal changed manually from the Meal Sheet stays under your control.</p>
              </div>
            </section>
          </div>
        </section>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]/95 p-3 backdrop-blur-lg lg:left-[var(--meal-pattern-sidebar-offset)]"
        style={{ '--meal-pattern-sidebar-offset': collapsed ? '72px' : '280px' } as CSSProperties}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <Button type="button" variant="ghost" disabled={step === 1 || saving} onClick={() => continueTo(step - 1)} className="min-h-11 rounded-xl px-3 font-semibold"><ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back</span></Button>
          <div className="flex flex-1 justify-end gap-2">
            {step < 3 ? (
              <Button type="button" onClick={() => continueTo(step + 1)} className="min-h-11 flex-1 rounded-xl bg-[var(--brand)] px-5 font-semibold text-white hover:bg-[var(--brand-hover)] sm:flex-none">Continue <ArrowRight className="size-4" /></Button>
            ) : (
              <>
                {(!initialPattern || initialPattern.status === 'DRAFT') && <Button type="button" variant="outline" disabled={saving} onClick={() => void submit(false)} className="min-h-11 rounded-xl px-3 font-semibold sm:px-5"><Save className="size-4" /> <span className="hidden sm:inline">Save draft</span><span className="sm:hidden">Draft</span></Button>}
                <Button type="button" disabled={saving} onClick={() => void submit(true)} className="min-h-11 flex-1 rounded-xl bg-[var(--brand)] px-4 font-semibold text-white shadow-[0_10px_22px_var(--brand-shadow)] hover:bg-[var(--brand-hover)] sm:flex-none sm:px-6">
                  {saving ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : <>{initialPattern && initialPattern.status !== 'DRAFT' ? 'Save changes' : 'Activate pattern'} <ArrowRight className="size-4" /></>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
