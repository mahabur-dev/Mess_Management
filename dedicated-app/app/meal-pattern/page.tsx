'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck2, CalendarDays, CalendarRange, Check, ChevronLeft, CircleCheck, RefreshCw, Sparkles, UtensilsCrossed } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { MobileShell } from '@/components/mobile-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Notice } from '@/components/ui/notice'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MealIconBadge } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
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

const meals: Array<{ key: MealName; label: string; hint: string; icon: string }> = [
  { key: 'BREAKFAST', label: 'Breakfast', hint: 'Morning meal', icon: '☀️' },
  { key: 'LUNCH', label: 'Lunch', hint: 'Midday meal', icon: '🥗' },
  { key: 'DINNER', label: 'Dinner', hint: 'Evening meal', icon: '🍲' },
]
const days = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
const dayLabels: Record<string, string> = { SATURDAY: 'Sat', SUNDAY: 'Sun', MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' }
const mealSteps: Record<MealName, number> = { BREAKFAST: 0.5, LUNCH: 1, DINNER: 1 }
const emptySchedule = (): Schedule => ({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })

function mealStep(meal: MealName) { return mealSteps[meal] }
function mealCountLabel(value: number) { return Number(value).toFixed(value % 1 ? 1 : 0) }

function todayIso() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function activePattern(patterns: Pattern[]) {
  return patterns.find((pattern) => pattern.status === 'ACTIVE') ?? null
}

function enabledLabels(schedule?: Schedule | null) {
  return meals.filter((meal) => Number(schedule?.[meal.key] ?? 0) > 0).map((meal) => `${meal.label} (${mealCountLabel(Number(schedule?.[meal.key] ?? 0))})`)
}

function scheduleTotal(schedule?: Schedule | null) {
  return meals.reduce((sum, meal) => sum + Number(schedule?.[meal.key] ?? 0), 0)
}

function PatternTypeCard({ type, selected, onSelect }: { type: PatternType; selected: boolean; onSelect: () => void }) {
  const daily = type === 'DAILY'
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="assistant-pattern-card"
      data-selected={selected ? 'true' : 'false'}
    >
      <span className="assistant-pattern-card__glow" aria-hidden="true" />
      <span className="assistant-pattern-card__dots" aria-hidden="true" />

      <span className="assistant-pattern-card__heading">
        <span className="assistant-pattern-card__icon" aria-hidden="true">
          {daily ? <CalendarDays size={24} strokeWidth={2.2} /> : <CalendarRange size={24} strokeWidth={2.2} />}
        </span>
        <span className="assistant-pattern-card__title">{daily ? 'Daily' : 'Weekly'}</span>
        <span className="assistant-pattern-card__badge">{daily ? 'Popular' : 'Flexible'}</span>
      </span>

      <span className="assistant-pattern-card__description">{daily ? 'Same meals every day' : 'Different meals for each day'}</span>

      <span className="assistant-pattern-card__features">
        <span><span className="assistant-pattern-card__check"><Check size={12} strokeWidth={3} /></span>{daily ? 'Fast to set up' : 'Plan around your week'}</span>
        <span><span className="assistant-pattern-card__check"><Check size={12} strokeWidth={3} /></span>{daily ? 'Best for regular routines' : 'Best for changing routines'}</span>
      </span>

      <span className="assistant-pattern-card__choice">
        {selected ? <Check size={16} strokeWidth={2.8} /> : null} {selected ? 'Selected' : 'Choose plan'}
      </span>
    </button>
  )
}

function MealScheduleEditor({ schedule, onChange }: { schedule: Schedule; onChange: (next: Schedule) => void }) {
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
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-label font-bold text-[#245d66]">Meals in this pattern</p><p className="mt-0.5 text-caption text-[#65838b]">Add one or more meals to your routine.</p></div><span className="rounded-full bg-[#dff4f3] px-2.5 py-1 text-caption font-bold text-[#00777a]">{mealCountLabel(total)} added</span></div>
      <div className="w-full">
        {meals.map((meal) => {
          const count = Number(schedule[meal.key] || 0)
          return <div key={meal.key} className="flex w-full items-center gap-3 border-b border-[#dce8e9] bg-white px-0 py-3 first:border-t">
            <MealIconBadge mealName={meal.key} size="sm" />
            <span className="min-w-0 flex-1"><span className="block text-label font-bold text-[#245d66]">{meal.label}</span><span className="block text-caption text-[#65838b]">{meal.hint}</span></span>
            <div className="flex h-9 shrink-0 items-center overflow-hidden border border-[#9edddc] bg-[#f8fbfb]">
              <button type="button" aria-label={`Reduce ${meal.label}`} onClick={() => changeCount(meal.key, -1)} className="grid h-full w-8 place-items-center text-[#00777a] hover:bg-[#dff4f3]">−</button>
              <input aria-label={`${meal.label} count`} type="number" min="0" step={mealStep(meal.key)} value={count} onChange={(event) => setCount(meal.key, event.target.value)} className="h-full w-12 border-x border-[#bfe7e6] bg-transparent text-center text-label font-bold text-[#245d66] outline-none" />
              <button type="button" aria-label={`Add more ${meal.label}`} onClick={() => changeCount(meal.key, 1)} className="grid h-full w-8 place-items-center bg-[#008d8c] text-white hover:bg-[#00777a]">+</button>
            </div>
          </div>
        })}
      </div>
    </div>
  )
}

export default function MealPatternPage() {
  const { user } = useAuth()
  const membership = user?.memberships?.find((item) => item.is_active !== false) ?? user?.memberships?.[0]
  const membershipId = membership?.id ?? ''
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'overview' | 'type' | 'schedule' | 'success'>('overview')
  const [type, setType] = useState<PatternType>('DAILY')
  const [daily, setDaily] = useState<Schedule>(() => ({ BREAKFAST: 0.5, LUNCH: 1, DINNER: 1 }))
  const [weekly, setWeekly] = useState<Record<string, Schedule>>(() => Object.fromEntries(days.map((day) => [day, emptySchedule()])))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const current = useMemo(() => activePattern(patterns), [patterns])
  const schedule = type === 'DAILY' ? daily : null
  const selectedCount = enabledLabels(schedule).length

  const loadPatterns = () => {
    if (!membershipId) return
    setLoading(true)
    api.getMealPatterns(membershipId).then((res) => setPatterns(Array.isArray(res.data) ? res.data : [])).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load your meal pattern.')).finally(() => setLoading(false))
  }

  useEffect(() => { loadPatterns() }, [membershipId])

  const startSetup = () => { setError(''); setStep('type') }
  const submit = async () => {
    if (!membershipId) return
    setSaving(true); setError('')
    try {
      await api.createMealPattern({ membershipId, patternType: type, startDate: todayIso(), activate: true, ...(type === 'DAILY' ? { dailySchedule: daily } : { weeklySchedule: weekly }) })
      setStep('success')
      loadPatterns()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to activate this pattern.') } finally { setSaving(false) }
  }

  if (loading) return <MobileShell><AppHeader title="Meal Pattern" subtitle="Simple, automatic meal planning" backHref="/" /><LoadingIndicator variant="screen" label="Loading meal pattern" /></MobileShell>

  return (
    <MobileShell>
      <AppHeader title="Meal Pattern" subtitle="Simple, automatic meal planning" backHref="/" />
      <div className="screen min-h-[calc(100dvh-var(--app-header-inset))] space-y-4 bg-[#f9fbfb] text-[#245d66]">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        {step === 'overview' ? (
          current ? (
            <>
              <Card variant="hero" className="assistant-active-schedule">
                <span className="assistant-active-schedule__glow" aria-hidden="true" />
                <span className="assistant-active-schedule__dots" aria-hidden="true" />
                <div className="assistant-active-schedule__heading">
                  <div className="min-w-0 flex-1">
                    <p className="assistant-active-schedule__eyebrow">Active schedule</p>
                    <h1 className="assistant-active-schedule__title">{current.pattern_type === 'DAILY' ? 'Daily pattern' : 'Weekly pattern'}</h1>
                  </div>
                  <span className="assistant-active-schedule__icon" aria-hidden="true"><CircleCheck size={23} strokeWidth={2.2} /></span>
                </div>
                <p className="assistant-active-schedule__description">Meals are added automatically from {new Date(current.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.</p>
              </Card>
              <Card title="Your schedule" subtitle="You can change this whenever your routine changes.">
                {current.pattern_type === 'DAILY' ? <div className="space-y-2">{enabledLabels(current.daily_schedule).map((label) => <div key={label} className="flex items-center gap-2 text-label text-[#245d66]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c]"><Check size={14} /></span>{label}</div>)}</div> : <div className="space-y-2">{days.map((day) => <div key={day} className="flex items-center justify-between border-b border-[#e4eaec] pb-2 text-label"><span className="text-[#245d66]">{dayLabels[day]}</span><span className="text-[#65838b]">{enabledLabels(current.weekly_schedule?.[day]).join(', ') || 'No meals'}</span></div>)}</div>}
              </Card>
              <Button className="w-full" onClick={startSetup}><RefreshCw size={17} /> Change pattern</Button>
            </>
          ) : (
            <>
              <Card variant="tint" className="py-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c]"><Sparkles size={30} /></div><h1 className="mt-4 text-headline text-[#245d66]">Set your meal pattern</h1><p className="mx-auto mt-2 max-w-[290px] text-body text-[#65838b]">Choose once and MessZen will keep your meal schedule updated automatically.</p></Card>
              <Button className="w-full" onClick={startSetup}>Create meal pattern <ArrowRight size={18} /></Button>
            </>
          )
        ) : null}

        {step === 'type' ? (
          <>
            <button type="button" className="flex items-center gap-1 text-label text-[#00777a]" onClick={() => setStep('overview')}><ChevronLeft size={18} /> Back</button>
            <div className="rounded-[18px] border border-[#dce8e9] bg-white p-4 shadow-[0_6px_16px_rgba(18,55,72,.04)]"><div className="flex items-center justify-between"><p className="text-caption font-bold uppercase tracking-[.12em] text-[#008d8c]">Step 1 of 2</p><span className="text-caption font-semibold text-[#65838b]">Choose a plan</span></div><h1 className="mt-2 text-headline font-semibold text-[#245d66]">How do you schedule meals?</h1><p className="mt-2 text-body text-[#52727b]">Pick the routine that best matches your week.</p></div>
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
                  <p className="text-label font-bold text-[#245d66]">Set it once, stay on track.</p>
                  <p className="mt-0.5 text-caption leading-4 text-[#52727b]">MessZen will manage your meal routine automatically.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3"><PatternTypeCard type="DAILY" selected={type === 'DAILY'} onSelect={() => setType('DAILY')} /><PatternTypeCard type="WEEKLY" selected={type === 'WEEKLY'} onSelect={() => setType('WEEKLY')} /></div>
            <Button className="w-full" onClick={() => setStep('schedule')}>Continue <ArrowRight size={18} /></Button>
          </>
        ) : null}

        {step === 'schedule' ? (
          <>
            <button type="button" className="flex items-center gap-1 text-label text-[#00777a]" onClick={() => setStep('type')}><ChevronLeft size={18} /> Back</button>
            <div className="relative overflow-hidden rounded-[14px] border border-[#d7e5e7] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(18,55,72,.06)]">
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#008d8c] via-[#35b7a9] to-[#f0b84b]" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption font-bold uppercase tracking-[.14em] text-[#008d8c]">Step 2 of 2</p>
                  <h1 className="mt-1 text-headline font-semibold leading-tight text-[#245d66]">{type === 'DAILY' ? 'What meals do you take?' : 'Plan each day'}</h1>
                  <p className="mt-2 max-w-[330px] text-body leading-5 text-[#65838b]">{type === 'DAILY' ? 'Add the meals you normally take every day.' : 'Add meals for each day. Empty days stay meal-free.'}</p>
                </div>
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#008d8c]"><CalendarCheck2 size={17} /></span>
              </div>
            </div>
            {type === 'DAILY' ? <div className="w-full rounded-[12px] border border-[#dce8e9] bg-white p-3"><MealScheduleEditor schedule={daily} onChange={setDaily} /></div> : <div className="w-full space-y-3">{days.map((day) => <div key={day} className="w-full rounded-[12px] border border-[#dce8e9] bg-white p-3"><div className="mb-2 flex items-center justify-between"><span className="text-label text-[#245d66]">{dayLabels[day]}</span><span className="text-caption text-[#65838b]">{mealCountLabel(scheduleTotal(weekly[day]))} added</span></div><MealScheduleEditor schedule={weekly[day]} onChange={(next) => setWeekly((old) => ({ ...old, [day]: next }))} /></div>)}</div>}
            <Button className="w-full" onClick={submit} busy={saving} disabled={type === 'DAILY' && selectedCount === 0}>Activate pattern <ArrowRight size={18} /></Button>
          </>
        ) : null}

        {step === 'success' ? <Card variant="tint" className="py-10 text-center"><div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#008d8c] text-white shadow-[0_10px_25px_rgba(0,141,140,.25)]"><Check size={48} strokeWidth={3} /></div><h1 className="mt-6 text-headline text-[#245d66]">Meal pattern activated</h1><p className="mx-auto mt-2 max-w-[300px] text-body text-[#65838b]">Your {type.toLowerCase()} meal schedule is now active. Meals will be added automatically.</p><Button className="mt-6 w-full" onClick={() => setStep('overview')}>View my schedule <ArrowRight size={18} /></Button></Card> : null}
      </div>
    </MobileShell>
  )
}
