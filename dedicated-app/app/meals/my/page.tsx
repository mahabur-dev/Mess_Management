'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Minus, Plus, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealCard,
  MealDateCard,
  MEAL_LABELS,
  MEAL_META,
  MEAL_ORDER,
  attendanceMealCount,
  deadlineLabel,
  findAttendanceForMember,
  findMeal,
  formatLocalIsoDate,
  mealIsLocked,
  MealStateIllustration,
  normalizeMeals,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useAuth } from '@/app/providers'

type MealCountMap = Record<MealName, string>

function isMealName(value: string | null): value is MealName {
  return MEAL_ORDER.includes(value as MealName)
}

function shiftIsoDate(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00`)
  nextDate.setDate(nextDate.getDate() + days)
  return formatLocalIsoDate(nextDate)
}

function compareIsoDate(date: string, compareWith = todayIsoDate()) {
  if (date < compareWith) return 'past'
  if (date > compareWith) return 'future'
  return 'today'
}

function formatMealCount(value: number) {
  return Number(value.toFixed(2)).toString()
}

function defaultMealCounts(): MealCountMap {
  return MEAL_ORDER.reduce((counts, mealName) => {
    counts[mealName] = formatMealCount(MEAL_META[mealName].baseValue)
    return counts
  }, {} as MealCountMap)
}

function mealCountsFromRecords(meals: MealRecord[], memberId?: string | null): MealCountMap {
  return MEAL_ORDER.reduce((counts, mealName) => {
    const meal = findMeal(meals, mealName)
    const attendance = findAttendanceForMember(meal, memberId)
    const count = attendance ? attendanceMealCount(mealName, attendance) : MEAL_META[mealName].baseValue
    counts[mealName] = formatMealCount(count)
    return counts
  }, {} as MealCountMap)
}

function normalizeMealCount(mealName: MealName, value: string) {
  const baseValue = MEAL_META[mealName].baseValue
  const rawCount = Number(value)
  if (!Number.isFinite(rawCount) || rawCount <= 0) return 0
  const rounded = Number((Math.round(rawCount * 2) / 2).toFixed(2))
  return Math.min(21, Math.max(baseValue, rounded))
}

function nextMealCount(mealName: MealName, value: string, direction: 1 | -1) {
  const baseValue = MEAL_META[mealName].baseValue
  const current = normalizeMealCount(mealName, value)
  if (direction === 1 && current === 0) return baseValue
  if (direction === -1 && current <= baseValue) return 0
  return normalizeMealCount(mealName, formatMealCount(current + direction * 0.5))
}

function SimpleMealInputCard({
  mealName,
  value,
  disabled,
  onChange,
  onStep,
}: {
  mealName: MealName
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onStep: (direction: 1 | -1) => void
}) {
  return (
    <div className="relative min-h-[118px] overflow-hidden rounded-[15px] border border-[#cfeeed] bg-[linear-gradient(145deg,#ffffff_0%,#fbffff_58%,#f1fbfb_100%)] px-2.5 py-2.5 shadow-[0_8px_18px_rgba(0,119,122,0.065)]">
      <div className="flex flex-col items-center text-center">
        <label htmlFor={`meal-count-${mealName}`} className="block max-w-full truncate text-caption font-bold text-[#123748]">
          {MEAL_LABELS[mealName]}
        </label>
      </div>

      <div className="mt-1.5">
        <input
          id={`meal-count-${mealName}`}
          aria-label={`${MEAL_LABELS[mealName]} meal count`}
          className="h-9 w-full min-w-0 rounded-[12px] border border-[#bfe7e6] bg-white px-1 text-center text-body font-bold tabular-nums text-[#123748] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(0,119,122,0.04)] transition focus:border-[#008d8c] focus:shadow-[0_0_0_4px_rgba(0,141,140,0.1)] disabled:opacity-60"
          type="number"
          inputMode="decimal"
          min="0"
          max="21"
          step="0.5"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onChange(formatMealCount(normalizeMealCount(mealName, event.target.value)))}
        />
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${MEAL_LABELS[mealName]} meal`}
          onClick={() => onStep(-1)}
          disabled={disabled}
          className="grid h-8 min-w-0 place-items-center rounded-[11px] border border-[#ffd8d8] bg-[#fff3f3] text-[#ee1f2f] shadow-[0_6px_12px_rgba(238,31,47,0.055)] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={16} />
        </button>

        <button
          type="button"
          aria-label={`Increase ${MEAL_LABELS[mealName]} meal`}
          onClick={() => onStep(1)}
          disabled={disabled}
          className="grid h-8 min-w-0 place-items-center rounded-[11px] border border-[#9edddc] bg-[#edfafa] text-[#008d8c] shadow-[0_6px_12px_rgba(0,119,122,0.06)] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

function MyMealContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const initialMeal = params.get('meal')
  const [date, setDate] = useState(params.get('date') || todayIsoDate())
  const [mealCounts, setMealCounts] = useState<MealCountMap>(() => {
    const defaults = defaultMealCounts()
    if (isMealName(initialMeal)) defaults[initialMeal] = formatMealCount(MEAL_META[initialMeal].baseValue)
    return defaults
  })
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [deadline, setDeadline] = useState<MealDeadlineInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)
    setMessage('')

    Promise.all([
      api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 }),
      api.getMealDeadline(messId, date),
    ])
      .then(([mealRes, deadlineRes]) => {
        if (!alive) return
        const mealList = normalizeMeals(mealRes.data)
        setMeals(mealList)
        setDeadline((deadlineRes.data ?? null) as MealDeadlineInfo | null)
        setMealCounts(mealCountsFromRecords(mealList, user?.id))
      })
      .catch((error) => {
        if (!alive) return
        setMeals([])
        setDeadline(null)
        setMealCounts(defaultMealCounts())
        setMessage(error instanceof Error ? error.message : 'Failed to load your meal.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, messId, user?.id])

  const hasLockedMeal = MEAL_ORDER.some((mealName) => mealIsLocked(findMeal(meals, mealName)))
  const statusMealName: MealName = isMealName(initialMeal) ? initialMeal : 'LUNCH'
  const windowOpen = Boolean(deadline?.isWindowOpen)
  const memberWindowOpen = windowOpen
  const closedForMember = hasLockedMeal || !memberWindowOpen
  const canSave = Boolean(messId) && (isManager || !closedForMember)
  const datePosition = compareIsoDate(date)
  const statusClosed = !isManager && closedForMember
  const statusText = statusClosed ? 'closed' : 'open'
  const statusDescription = hasLockedMeal
    ? isManager
      ? 'This meal is locked, but managers can still update it.'
      : 'This meal is locked by manager.'
    : isManager
      ? 'Managers can update meals anytime.'
      : windowOpen
        ? 'Choose how you want to take this meal.'
        : datePosition === 'past'
          ? 'Previous date meals can only be updated by manager.'
          : 'Meal updating time is over for this date.'

  function updateMealCount(mealName: MealName, value: string) {
    setMealCounts((current) => ({ ...current, [mealName]: value }))
  }

  function stepMealCount(mealName: MealName, direction: 1 | -1) {
    setMealCounts((current) => ({
      ...current,
      [mealName]: formatMealCount(nextMealCount(mealName, current[mealName], direction)),
    }))
  }

  async function saveMeal() {
    if (!messId || !canSave) return
    setSaving(true)
    setMessage('')

    try {
      await Promise.all(
        MEAL_ORDER.map((mealName) => {
          const baseValue = MEAL_META[mealName].baseValue
          const mealCount = normalizeMealCount(mealName, mealCounts[mealName])
          const status = mealCount === 0 ? 'OFF' : 'ON'
          const guests = status === 'OFF' ? 0 : Number((mealCount - baseValue).toFixed(2))

          return api.createMeal({
            messId,
            mealName,
            status,
            guests,
            mealCount,
            date,
          })
        })
      )

      const [mealRes, deadlineRes] = await Promise.all([
        api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 }),
        api.getMealDeadline(messId, date),
      ])
      const mealList = normalizeMeals(mealRes.data)
      setMeals(mealList)
      setDeadline((deadlineRes.data ?? null) as MealDeadlineInfo | null)
      setMealCounts(mealCountsFromRecords(mealList, user?.id))
      setMessage('Meal saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save meal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="My Meal" subtitle="Add or update your meal" backHref="/meals" />
      <div className="screen space-y-3">
        <MealDateCard date={date} onChange={setDate} onPrevious={() => setDate((current) => shiftIsoDate(current, -1))} onNext={() => setDate((current) => shiftIsoDate(current, 1))} />

        <MealCard className="text-center">
          <MealStateIllustration state={statusClosed ? 'locked' : 'open'} mealName={statusMealName} />

          <h2 className={`mt-5 text-title font-bold ${statusClosed ? 'text-[#ee1f2f]' : 'text-[#123748]'}`}>
            Yours meal is {statusText}
          </h2>
          <p className="mt-2 text-label font-semibold text-[#65838b]">{statusDescription}</p>
          <div className="mt-3 inline-flex items-center rounded-full bg-[#edfafa] px-4 py-2 text-caption font-bold text-[#123748]">
            {deadlineLabel(deadline)}
          </div>
        </MealCard>

        {message ? <InlineNotice tone={message.includes('successfully') ? 'success' : 'danger'}>{message}</InlineNotice> : null}

        {loading ? <LoadingIndicator variant="card" label="Loading meal preference" /> : null}

        {!canSave ? (
          <InlineNotice tone="warning">
            {hasLockedMeal
              ? 'This meal is locked by manager.'
              : datePosition === 'past'
                ? 'Previous date meals can only be changed by manager.'
                : 'You can no longer add or update this meal.'}
          </InlineNotice>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {MEAL_ORDER.map((mealName) => (
            <SimpleMealInputCard
              key={mealName}
              mealName={mealName}
              value={mealCounts[mealName]}
              disabled={!canSave || saving || loading}
              onChange={(value) => updateMealCount(mealName, value)}
              onStep={(direction) => stepMealCount(mealName, direction)}
            />
          ))}
        </div>

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60" onClick={saveMeal} disabled={!canSave || saving || loading}>
          <UtensilsCrossed size={18} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </MobileShell>
  )
}

export default function MyMealPage() {
  return (
    <Suspense fallback={<LoadingIndicator variant="screen" label="Loading meal preference" />}>
      <MyMealContent />
    </Suspense>
  )
}
