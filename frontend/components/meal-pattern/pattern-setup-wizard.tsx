'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck2, CalendarDays, Check, CircleCheck, Clock3, Loader2, Repeat2, Save, Sparkles } from 'lucide-react'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDatePicker } from '@/components/ui/enterprise-date-picker'
import type {
  CreateMealPatternInput,
  MealPattern,
  MealPatternSchedule,
  MealPatternType,
  MealPatternWeeklySchedule,
} from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'
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
import { ScheduleEditor } from './schedule-editor'
import { SchedulePreview } from './schedule-preview'

interface PatternSetupWizardProps {
  membershipId: string
  memberName: string
  initialPattern?: MealPattern | null
  saving: boolean
  onSubmit: (payload: CreateMealPatternInput, activate: boolean) => Promise<void>
}

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
          ? 'border-[var(--brand)] bg-[var(--brand-softer)] '
          : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] hover:border-[var(--brand-border)] ',
      )}
    >
      <span className={cn('grid size-12 place-items-center rounded-2xl', selected ? 'bg-[var(--brand)] text-primary-foreground' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}>
        <Icon className="size-6" />
      </span>
      <span className="mt-5 block text-lg font-semibold text-foreground">{title}</span>
      <span className="mt-1 block text-sm font-semibold leading-6 text-muted-foreground">{description}</span>
      <span className="mt-4 block space-y-2">
        {bullets.map((bullet) => <span key={bullet} className="flex items-center gap-2 text-xs font-semibold text-foreground"><Check className="size-3.5 text-[var(--brand)]" /> {bullet}</span>)}
      </span>
      <span className={cn('absolute right-4 top-4 grid size-6 place-items-center rounded-full border', selected ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground' : 'border-[var(--dashboard-line-strong)]')}>
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  )
}

export function PatternSetupWizard({ membershipId, memberName, initialPattern, saving, onSubmit }: PatternSetupWizardProps) {
  const t = useTranslations('mealPatterns')
  const steps = [
    { number: 1, label: t('setup.routineStep') },
    { number: 2, label: t('setup.mealsStep') },
    { number: 3, label: t('setup.reviewStep') },
  ]
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
      setError(t('setup.chooseMealContinue'))
      return
    }
    setStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (activate: boolean) => {
    setError('')
    if (!membershipId) return setError(t('setup.missingMember'))
    if (selectedTotal <= 0) return setError(t('setup.chooseMealSave'))
    if (!startDate) return setError(t('setup.chooseStart'))
    if (hasEndDate && (!endDate || endDate < startDate)) return setError(t('setup.invalidEnd'))

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
    <div className="mx-auto max-w-6xl pb-8">
      <div className="mb-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex min-w-[420px] max-w-2xl items-center justify-center">
          {steps.map((item, index) => (
            <div key={item.number} className="flex items-center">
              <button type="button" onClick={() => item.number < step && continueTo(item.number)} disabled={item.number > step} className="flex min-h-11 items-center gap-2 rounded-xl px-2 disabled:cursor-default">
                <span className={cn('grid size-8 place-items-center rounded-full text-xs font-semibold', step >= item.number ? 'bg-[var(--brand)] text-primary-foreground' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}>{step > item.number ? <Check className="size-4" /> : item.number}</span>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{t('setup.settingUpFor')}</p>
          <p className="truncate text-sm font-semibold text-foreground">{memberName}</p>
        </div>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">{error}</div>}

      {step === 1 && (
        <section>
          <div className="mb-5 text-center sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{t('setup.step', { current: 1, total: 3 })}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t('setup.routineTitle')}</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{t('setup.routineDescription')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ChoiceCard selected={patternType === 'DAILY'} icon={Repeat2} title={t('setup.dailyChoice')} description={t('setup.dailyChoiceDescription')} bullets={[t('setup.dailyBulletOne'), t('setup.dailyBulletTwo')]} onClick={() => setPatternType('DAILY')} />
            <ChoiceCard selected={patternType === 'WEEKLY'} icon={CalendarCheck2} title={t('setup.weeklyChoice')} description={t('setup.weeklyChoiceDescription')} bullets={[t('setup.weeklyBulletOne'), t('setup.weeklyBulletTwo')]} onClick={() => setPatternType('WEEKLY')} />
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{t('setup.step', { current: 2, total: 3 })}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t('setup.mealsTitle')}</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{t('setup.mealsDescription')}</p>
          </div>
          <ScheduleEditor type={patternType} dailySchedule={dailySchedule} weeklySchedule={weeklySchedule} onDailyChange={setDailySchedule} onWeeklyChange={setWeeklySchedule} />
        </section>
      )}

      {step === 3 && (
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{t('setup.step', { current: 3, total: 3 })}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t('setup.reviewTitle')}</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{t('setup.reviewDescription')}</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-5">
              <section className="dashboard-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><CalendarDays className="size-5" /></span>
                  <div><h2 className="font-semibold text-foreground">{t('setup.startDate')}</h2><p className="text-xs font-semibold text-muted-foreground">{t('setup.startDescription')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setStartDate(today)} className={cn('min-h-11 rounded-xl border text-sm font-semibold', startDate === today ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}>{t('setup.today')}</button>
                  <button type="button" onClick={() => setStartDate(shiftDateKey(today, 1))} className={cn('min-h-11 rounded-xl border text-sm font-semibold', startDate === shiftDateKey(today, 1) ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}>{t('setup.tomorrow')}</button>
                </div>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('setup.chooseDate')}</span>
                  <EnterpriseDatePicker value={startDate} onValueChange={setStartDate} min={today} className="h-12 w-full" align="start" ariaLabel={t('setup.selectStart')} />
                </label>
              </section>

              <section className="dashboard-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Clock3 className="size-5" /></span>
                  <div><h2 className="font-semibold text-foreground">{t('setup.duration')}</h2><p className="text-xs font-semibold text-muted-foreground">{t('setup.durationDescription')}</p></div>
                </div>
                <div className="space-y-2">
                  <button type="button" disabled={endDateLocked} onClick={() => setHasEndDate(false)} className={cn('flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45', !hasEndDate ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}><span>{t('setup.continueUntilStopped')}</span>{!hasEndDate && <CircleCheck className="size-4" />}</button>
                  <button type="button" onClick={() => { setHasEndDate(true); if (!endDate) setEndDate(shiftDateKey(startDate || today, 30)) }} className={cn('flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold', hasEndDate ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'border-[var(--dashboard-line)] text-muted-foreground')}><span>{t('setup.endOnDate')}</span>{hasEndDate && <CircleCheck className="size-4" />}</button>
                </div>
                {endDateLocked && <p className="mt-3 text-xs font-semibold leading-5 text-muted-foreground">{t('setup.lockedEnd')}</p>}
                {hasEndDate && <label className="mt-3 block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('setup.endDate')}</span><EnterpriseDatePicker value={endDate} onValueChange={setEndDate} min={startDate} className="h-12 w-full" align="start" ariaLabel={t('setup.selectEnd')} /></label>}
              </section>
            </div>

            <section className="dashboard-card p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{t('setup.finalReview')}</p><h2 className="mt-1 text-xl font-semibold text-foreground">{t(patternType === 'DAILY' ? 'setup.dailyReview' : 'setup.weeklyReview')}</h2></div>
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">{t(patternType === 'DAILY' ? 'setup.perDay' : 'setup.perWeek', { count: selectedTotal })}</span>
              </div>
              <SchedulePreview pattern={previewPattern} />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('setup.starts')}</p><p className="mt-1 text-xs font-semibold text-foreground">{startDate}</p></div>
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('setup.ends')}</p><p className="mt-1 text-xs font-semibold text-foreground">{hasEndDate ? endDate || t('setup.chooseDate') : t('setup.whenStopped')}</p></div>
              </div>
              <div className="mt-5 flex gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-softer)] p-4">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-[var(--brand)]" />
                <p className="text-xs font-semibold leading-5 text-foreground">{t('setup.automationNote')}</p>
              </div>
            </section>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-end gap-2">
          <EnterpriseButton tone="secondary" disabled={step === 1 || saving} onClick={() => continueTo(step - 1)}>
          <ArrowLeft className="size-4" /> {t('setup.backButton')}
        </EnterpriseButton>
        {step < 3 ? (
          <EnterpriseButton onClick={() => continueTo(step + 1)}>
            {t('setup.continue')} <ArrowRight className="size-4" />
          </EnterpriseButton>
        ) : (
          <>
            {(!initialPattern || initialPattern.status === 'DRAFT') && (
                <EnterpriseButton tone="secondary" disabled={saving} onClick={() => void submit(false)}>
                <Save className="size-4" /> {t('setup.saveDraft')}
              </EnterpriseButton>
            )}
            <EnterpriseButton disabled={saving} onClick={() => void submit(true)}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> {t('setup.saving')}</> : <>{initialPattern && initialPattern.status !== 'DRAFT' ? t('setup.saveChanges') : t('setup.activate')} <ArrowRight className="size-4" /></>}
            </EnterpriseButton>
          </>
        )}
      </div>
    </div>
  )
}
