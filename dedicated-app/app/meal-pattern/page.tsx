'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck2, CalendarDays, CalendarRange, Check, ChevronLeft, CircleCheck, RefreshCw, Sparkles, UtensilsCrossed } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { MobileShell } from '@/components/mobile-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Notice } from '@/components/ui/notice'
import { LoadingIndicator } from '@/components/loading-indicator'
import { AssistantInfoCard } from '@/components/mobile/assistant-info-card'
import { MealIconBadge, mealHint, mealLabel, todayIsoDate } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { formatNumber, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations, type Locale } from '@/lib/i18n'
import { useAuth } from '../providers'

type MealName = 'BREAKFAST' | 'LUNCH' | 'DINNER'
type PatternType = 'DAILY' | 'WEEKLY'
type Schedule = Record<MealName, number>
type Pattern = {
  id: string
  pattern_type: PatternType
  status: string
  start_date: string
  end_date?: string | null
  daily_schedule?: Schedule | null
  weekly_schedule?: Record<string, Schedule> | null
}

const meals: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']
const days = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
const dayTranslationKeys = {
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
} as const
const mealSteps: Record<MealName, number> = { BREAKFAST: 0.5, LUNCH: 1, DINNER: 1 }
const emptySchedule = (): Schedule => ({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })

function mealStep(meal: MealName) { return mealSteps[meal] }
function mealCountLabel(value: number, locale: Locale) {
  return formatNumber(value, locale, { maximumFractionDigits: 1 })
}

function activePattern(patterns: Pattern[]) {
  return patterns.find((pattern) => pattern.status === 'ACTIVE') ?? null
}

function enabledLabels(schedule: Schedule | null | undefined, locale: Locale) {
  return meals
    .filter((meal) => Number(schedule?.[meal] ?? 0) > 0)
    .map((meal) => `${mealLabel(meal, locale)} (${mealCountLabel(Number(schedule?.[meal] ?? 0), locale)})`)
}

function scheduleTotal(schedule?: Schedule | null) {
  return meals.reduce((sum, meal) => sum + Number(schedule?.[meal] ?? 0), 0)
}

function PatternTypeCard({ type, selected, onSelect }: { type: PatternType; selected: boolean; onSelect: () => void }) {
  const daily = type === 'DAILY'
  const copy = useTranslations('meals')
  return (
    <label
      className="assistant-pattern-card"
      data-selected={selected ? 'true' : 'false'}
    >
      <input
        type="radio"
        name="meal-pattern-type"
        value={type}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="assistant-pattern-card__glow" aria-hidden="true" />
      <span className="assistant-pattern-card__dots" aria-hidden="true" />

      <span className="assistant-pattern-card__heading">
        <span className="assistant-pattern-card__icon" aria-hidden="true">
          {daily ? <CalendarDays size={24} strokeWidth={2.2} /> : <CalendarRange size={24} strokeWidth={2.2} />}
        </span>
        <span className="assistant-pattern-card__title">{daily ? copy('daily') : copy('weekly')}</span>
        <span className="assistant-pattern-card__badge">{daily ? copy('popular') : copy('flexible')}</span>
      </span>

      <span className="assistant-pattern-card__description">{daily ? copy('sameEveryDay') : copy('differentEachDay')}</span>

      <span className="assistant-pattern-card__features">
        <span><span className="assistant-pattern-card__check"><Check size={12} strokeWidth={3} /></span>{daily ? copy('fastSetup') : copy('planWeek')}</span>
        <span><span className="assistant-pattern-card__check"><Check size={12} strokeWidth={3} /></span>{daily ? copy('regularRoutine') : copy('changingRoutine')}</span>
      </span>
    </label>
  )
}

function MealScheduleEditor({ schedule, onChange }: { schedule: Schedule; onChange: (next: Schedule) => void }) {
  const { locale } = useLocale()
  const copy = useTranslations('meals')
  const total = scheduleTotal(schedule)
  const changeCount = (meal: MealName, direction: -1 | 1) => {
    const next = Math.max(0, Number((schedule[meal] + direction * mealStep(meal)).toFixed(2)))
    onChange({ ...schedule, [meal]: next })
  }
  const setCount = (meal: MealName, value: string) => {
    const parsed = Number(value)
    onChange({ ...schedule, [meal]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 })
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-label font-semibold text-[#245d66]">{copy('mealsInPattern')}</p><p className="mt-0.5 text-caption text-[#65838b]">{copy('addMealsRoutine')}</p></div><span className="rounded-full bg-[#dff4f3] px-2.5 py-1 text-caption font-semibold text-[#00777a]">{copy('countAdded', { count: mealCountLabel(total, locale) })}</span></div>
      <div className="w-full">
        {meals.map((meal) => {
          const count = Number(schedule[meal] || 0)
          const label = mealLabel(meal, locale)
          return <div key={meal} className="flex w-full items-center gap-3 border-b border-[#dce8e9] bg-white px-0 py-3 first:border-t">
            <MealIconBadge mealName={meal} size="sm" />
            <span className="min-w-0 flex-1"><span className="block text-label font-semibold text-[#245d66]">{label}</span><span className="block text-caption text-[#65838b]">{mealHint(meal, locale)}</span></span>
            <div className="flex h-9 shrink-0 items-center overflow-hidden border border-[#9edddc] bg-[#f8fbfb]">
              <button type="button" aria-label={copy('reduceMeal', { meal: label })} onClick={() => changeCount(meal, -1)} className="grid h-full w-8 place-items-center text-[#00777a] hover:bg-[#dff4f3]">−</button>
              <input aria-label={copy('mealCount', { meal: label })} type="number" min="0" step={mealStep(meal)} value={count} onChange={(event) => setCount(meal, event.target.value)} className="h-full w-12 border-x border-[#bfe7e6] bg-transparent text-center text-label font-semibold text-[#245d66] outline-none" />
              <button type="button" aria-label={copy('addMoreMeal', { meal: label })} onClick={() => changeCount(meal, 1)} className="grid h-full w-8 place-items-center bg-[#008d8c] text-white hover:bg-[#00777a]">+</button>
            </div>
          </div>
        })}
      </div>
    </div>
  )
}

export default function MealPatternPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const copy = useTranslations('meals')
  const membership = user?.memberships?.find((item) => item.is_active !== false) ?? user?.memberships?.[0]
  const membershipId = membership?.id ?? ''
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'overview' | 'type' | 'schedule' | 'success'>('overview')
  const [type, setType] = useState<PatternType>('DAILY')
  const [daily, setDaily] = useState<Schedule>(() => ({ BREAKFAST: 0.5, LUNCH: 1, DINNER: 1 }))
  const [weekly, setWeekly] = useState<Record<string, Schedule>>(() => Object.fromEntries(days.map((day) => [day, emptySchedule()])))
  const [saving, setSaving] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  const current = useMemo(() => activePattern(patterns), [patterns])
  const hasSelectedMeals = type === 'DAILY'
    ? scheduleTotal(daily) > 0
    : days.some((day) => scheduleTotal(weekly[day]) > 0)

  const loadPatterns = useCallback(async (showLoading = true) => {
    if (!membershipId) {
      showMessage('noMessSelected', 'warning')
      setLoading(false)
      return false
    }
    if (showLoading) {
      setLoading(true)
      clearNotice()
    }
    try {
      const response = await api.getMealPatterns(membershipId)
      setPatterns(Array.isArray(response.data) ? response.data : [])
      return true
    } catch (error) {
      showError(error, 'loadPatternFailed')
      return false
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [clearNotice, membershipId, showError, showMessage])

  useEffect(() => { void loadPatterns() }, [loadPatterns])

  const startSetup = () => { clearNotice(); setStep('type') }
  const submit = async () => {
    if (!membershipId) return showMessage('noMessSelected', 'warning')
    if (!hasSelectedMeals) return showMessage('patternMealRequired', 'danger')
    setSaving(true); clearNotice()
    try {
      await api.createMealPattern({ membershipId, patternType: type, startDate: todayIsoDate(), activate: true, ...(type === 'DAILY' ? { dailySchedule: daily } : { weeklySchedule: weekly }) })
      const refreshed = await loadPatterns(false)
      if (!refreshed) return
      setStep('success')
    } catch (error) { showError(error, 'activatePatternFailed') } finally { setSaving(false) }
  }

  if (loading) return <MobileShell><AppHeader title={copy('mealPattern')} subtitle={copy('patternSubtitle')} backHref="/" /><LoadingIndicator variant="screen" label={copy('loadingPattern')} /></MobileShell>

  return (
    <MobileShell>
      <AppHeader title={copy('mealPattern')} subtitle={copy('patternSubtitle')} backHref="/" />
      <div className="screen min-h-[calc(100dvh-var(--app-header-inset))] space-y-4 bg-[#f9fbfb] text-[#245d66]">
        {notice ? <Notice tone={notice.tone}>{notice.message}</Notice> : null}

        {step === 'overview' ? (
          current ? (
            <>
              <AssistantInfoCard
                eyebrow={copy('activeSchedule')}
                title={current.pattern_type === 'DAILY' ? copy('dailyPattern') : copy('weeklyPattern')}
                description={copy('automaticFromDate', { date: format.date(current.start_date, { month: 'short', day: 'numeric', year: undefined }) })}
                icon={CircleCheck}
              />
              <Card title={copy('yourSchedule')} subtitle={copy('changeAnytime')}>
                {current.pattern_type === 'DAILY' ? <div className="space-y-2">{enabledLabels(current.daily_schedule, locale).map((label) => <div key={label} className="flex items-center gap-2 text-label text-[#245d66]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c]"><Check size={14} /></span>{label}</div>)}</div> : <div className="space-y-2">{days.map((day) => <div key={day} className="flex items-center justify-between border-b border-[#e4eaec] pb-2 text-label"><span className="text-[#245d66]">{copy(dayTranslationKeys[day])}</span><span className="text-[#65838b]">{enabledLabels(current.weekly_schedule?.[day], locale).join(', ') || copy('noMeals')}</span></div>)}</div>}
              </Card>
              <Button className="w-full" onClick={startSetup}><RefreshCw size={17} /> {copy('changePattern')}</Button>
            </>
          ) : (
            <>
              <Card variant="tint" className="py-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c]"><Sparkles size={30} /></div><h1 className="mt-4 text-headline text-[#245d66]">{copy('setPattern')}</h1><p className="mx-auto mt-2 max-w-[290px] text-body text-[#65838b]">{copy('setPatternDescription')}</p></Card>
              <Button className="w-full" onClick={startSetup}>{copy('createPattern')} <ArrowRight size={18} /></Button>
            </>
          )
        ) : null}

        {step === 'type' ? (
          <>
            <button type="button" className="flex items-center gap-1 text-label text-[#00777a]" onClick={() => setStep('overview')}><ChevronLeft size={18} /> {copy('back')}</button>
            <div className="rounded-[18px] border border-[#dce8e9] bg-white p-4 shadow-[0_6px_16px_rgba(18,55,72,.04)]"><p className="text-caption font-semibold uppercase tracking-[.12em] text-[#008d8c]">{copy('stepOne')}</p><h1 className="mt-2 text-headline font-semibold text-[#245d66]">{copy('scheduleQuestion')}</h1><p className="mt-2 text-body text-[#52727b]">{copy('scheduleQuestionHint')}</p></div>
            <div className="relative overflow-hidden rounded-[14px] border border-[#bfe7e6] bg-gradient-to-br from-[#edfafa] via-white to-[#fff9ed] px-4 py-3 shadow-[0_8px_18px_rgba(0,141,140,.08)]">
              <div className="absolute -right-5 -top-7 h-20 w-20 rounded-full bg-[#dff4f3]/70" />
              <div className="relative flex items-center gap-3">
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#008d8c] shadow-sm"><UtensilsCrossed size={16} /></span>
                  <span className="h-px w-3 bg-[#9edddc]" />
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#008d8c] shadow-sm"><CalendarCheck2 size={16} /></span>
                  <span className="h-px w-3 bg-[#f0c66b]" />
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff2d8] text-[#d98b10] shadow-sm"><Sparkles size={16} /></span>
                </div>
                <div className="min-w-0 border-l border-[#bfe7e6] pl-3">
                  <p className="text-label font-semibold text-[#245d66]">{copy('setOnce')}</p>
                  <p className="mt-0.5 text-caption leading-4 text-[#52727b]">{copy('automaticRoutine')}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={copy('scheduleQuestion')}><PatternTypeCard type="DAILY" selected={type === 'DAILY'} onSelect={() => setType('DAILY')} /><PatternTypeCard type="WEEKLY" selected={type === 'WEEKLY'} onSelect={() => setType('WEEKLY')} /></div>
            <Button className="w-full" onClick={() => setStep('schedule')}>{copy('continue')} <ArrowRight size={18} /></Button>
          </>
        ) : null}

        {step === 'schedule' ? (
          <>
            <button type="button" className="flex items-center gap-1 text-label text-[#00777a]" onClick={() => setStep('type')}><ChevronLeft size={18} /> {copy('back')}</button>
            <AssistantInfoCard
              eyebrow={copy('stepTwo')}
              title={type === 'DAILY' ? copy('whatMeals') : copy('planEachDay')}
              description={type === 'DAILY' ? copy('dailyScheduleHint') : copy('weeklyScheduleHint')}
              icon={CalendarCheck2}
            />
            {type === 'DAILY' ? <div className="w-full rounded-[12px] border border-[#dce8e9] bg-white p-3"><MealScheduleEditor schedule={daily} onChange={setDaily} /></div> : <div className="w-full space-y-3">{days.map((day) => <div key={day} className="w-full rounded-[12px] border border-[#dce8e9] bg-white p-3"><div className="mb-2 flex items-center justify-between"><span className="text-label text-[#245d66]">{copy(dayTranslationKeys[day])}</span><span className="text-caption text-[#65838b]">{copy('countAdded', { count: mealCountLabel(scheduleTotal(weekly[day]), locale) })}</span></div><MealScheduleEditor schedule={weekly[day]} onChange={(next) => setWeekly((old) => ({ ...old, [day]: next }))} /></div>)}</div>}
            <Button className="w-full" onClick={submit} busy={saving} disabled={!hasSelectedMeals}>{copy('activatePattern')} <ArrowRight size={18} /></Button>
          </>
        ) : null}

        {step === 'success' ? (
          <Card variant="tint" className="assistant-success-card">
            <span className="assistant-success-card__glow" aria-hidden="true" />
            <span className="assistant-success-card__dots" aria-hidden="true" />
            <span className="assistant-success-card__icon" aria-hidden="true"><Check size={38} strokeWidth={2.8} /></span>
            <h1 className="assistant-success-card__title">{copy('patternActivated')}</h1>
            <p className="assistant-success-card__description">{copy('patternActivatedDescription', { type: type === 'DAILY' ? copy('daily').toLocaleLowerCase(locale) : copy('weekly').toLocaleLowerCase(locale) })}</p>
            <Button className="assistant-success-card__action w-full" onClick={() => setStep('overview')}>{copy('viewSchedule')} <ArrowRight size={18} /></Button>
          </Card>
        ) : null}
      </div>
    </MobileShell>
  )
}
