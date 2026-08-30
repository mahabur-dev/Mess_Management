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
  MEAL_META,
  MEAL_ORDER,
  attendanceMealCount,
  deadlineLabel,
  findAttendanceForMember,
  findMeal,
  formatLocalIsoDate,
  mealIsLocked,
  mealHint,
  mealLabel,
  MealStateIllustration,
  MealIconBadge,
  normalizeMeals,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useAuth } from '@/app/providers'
import { useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

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
  const { locale } = useLocale()
  const meals = useTranslations('meals')
  const label = mealLabel(mealName, locale)
  return (
    <div className="flex w-full items-center gap-3 border-b border-[#dce8e9] bg-white px-3 py-3 last:border-b-0">
      <MealIconBadge mealName={mealName} size="sm" />
      <label htmlFor={`meal-count-${mealName}`} className="min-w-0 flex-1 text-left">
        <span className="block text-label font-bold text-[#123748]">{label}</span>
        <span className="block text-caption text-[#65838b]">{mealHint(mealName, locale)}</span>
      </label>

      <div className="flex h-9 shrink-0 items-center overflow-hidden border border-[#9edddc] bg-[#f8fbfb]">
        <button
          type="button"
          aria-label={meals('decreaseMeal', { meal: label })}
          onClick={() => onStep(-1)}
          disabled={disabled}
          className="grid h-full w-8 place-items-center text-[#00777a] transition hover:bg-[#dff4f3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={16} />
        </button>
        <input
          id={`meal-count-${mealName}`}
          aria-label={meals('mealCount', { meal: label })}
          className="h-full w-12 border-x border-[#bfe7e6] bg-transparent px-1 text-center text-label font-semibold tabular-nums text-[#245d66] outline-none disabled:opacity-60"
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
        
        <button
          type="button"
          aria-label={meals('increaseMeal', { meal: label })}
          onClick={() => onStep(1)}
          disabled={disabled}
          className="grid h-full w-8 place-items-center bg-[#008d8c] text-white transition hover:bg-[#00777a] disabled:cursor-not-allowed disabled:opacity-50"
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
  const { locale } = useLocale()
  const mealCopy = useTranslations('meals')
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
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    if (!messId) {
      setMeals([])
      setDeadline(null)
      setMealCounts(defaultMealCounts())
      setLoading(false)
      showMessage('noMessSelected', 'warning')
      return
    }
    let alive = true
    setLoading(true)
    clearNotice()

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
        showError(error, 'loadMyMealFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clearNotice, date, messId, showError, showMessage, user?.id])

  const hasLockedMeal = MEAL_ORDER.some((mealName) => mealIsLocked(findMeal(meals, mealName)))
  const statusMealName: MealName = isMealName(initialMeal) ? initialMeal : 'LUNCH'
  const windowOpen = Boolean(deadline?.isWindowOpen)
  const memberWindowOpen = windowOpen
  const closedForMember = hasLockedMeal || !memberWindowOpen
  const canSave = Boolean(messId) && (isManager || !closedForMember)
  const datePosition = compareIsoDate(date)
  const statusClosed = !isManager && closedForMember
  const statusText = statusClosed ? mealCopy('closed') : mealCopy('open')
  const statusDescription = hasLockedMeal
    ? isManager
      ? mealCopy('managerLockedCanUpdate')
      : mealCopy('lockedByManager')
    : isManager
      ? mealCopy('managerAnytime')
      : windowOpen
        ? mealCopy('chooseMealCount')
        : datePosition === 'past'
          ? mealCopy('pastManagerOnly')
          : mealCopy('updateTimeOver')

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
    clearNotice()

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
      showMessage('mealSaved', 'success')
    } catch (error) {
      showError(error, 'mealSaveFailed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={mealCopy('myMeal')} subtitle={mealCopy('myMealDescription')} backHref="/meals" />
      <div className="screen space-y-3">
        <MealDateCard date={date} onChange={setDate} onPrevious={() => setDate((current) => shiftIsoDate(current, -1))} onNext={() => setDate((current) => shiftIsoDate(current, 1))} />

        <MealCard className="text-center">
          <MealStateIllustration state={statusClosed ? 'locked' : 'open'} mealName={statusMealName} />

          <h2 className={`mt-5 text-title font-bold ${statusClosed ? 'text-[#ee1f2f]' : 'text-[#123748]'}`}>
            {mealCopy('yourMealState', { state: statusText })}
          </h2>
          <p className="mt-2 text-label font-semibold text-[#65838b]">{statusDescription}</p>
          <div className="mt-3 inline-flex items-center rounded-full bg-[#edfafa] px-4 py-2 text-caption font-bold text-[#123748]">
            {deadlineLabel(deadline, locale)}
          </div>
        </MealCard>

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

        {loading ? <LoadingIndicator variant="card" label={mealCopy('loadingPreference')} /> : null}

        {!canSave ? (
          <InlineNotice tone="warning">
            {hasLockedMeal
              ? mealCopy('lockedByManager')
              : datePosition === 'past'
                ? mealCopy('pastManagerOnly')
                : mealCopy('cannotUpdate')}
          </InlineNotice>
        ) : null}

        <div className="overflow-hidden rounded-[12px] border border-[#dce8e9] bg-white">
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
          <UtensilsCrossed size={18} /> {saving ? mealCopy('saving') : mealCopy('save')}
        </button>
      </div>
    </MobileShell>
  )
}

export default function MyMealPage() {
  const meals = useTranslations('meals')
  return (
    <Suspense fallback={<LoadingIndicator variant="screen" label={meals('loadingPreference')} />}>
      <MyMealContent />
    </Suspense>
  )
}
