'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Info, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  GuestMealCountInput,
  MealCard,
  MealDateCard,
  MEAL_LABELS,
  MEAL_META,
  MEAL_ORDER,
  MealOptionRow,
  MealStatusPill,
  MealStateIllustration,
  MealTabs,
  SaveConfirmNote,
  deadlineLabel,
  findAttendanceForMember,
  findMeal,
  formatLocalIsoDate,
  mealIsLocked,
  normalizeMeals,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useAuth } from '@/app/providers'

type MealChoice = 'GUEST' | 'NO' | 'TAKE'

function isMealName(value: string | null): value is MealName {
  return MEAL_ORDER.includes(value as MealName)
}

function choiceFromAttendance(status?: string, guests?: number | string | null): MealChoice {
  if (status === 'OFF') return 'NO'
  if (Number(guests ?? 0) > 0) return 'GUEST'
  return 'TAKE'
}

function guestValueFromAttendance(guests?: number | string | null) {
  const value = Number(guests ?? 0)
  return value > 0 ? String(value) : '1'
}

function normalizeGuestMealCount(value: string) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(20, Math.max(1, Number(count.toFixed(1))))
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

function MyMealContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const initialMeal = params.get('meal')
  const [date, setDate] = useState(params.get('date') || todayIsoDate())
  const [mealName, setMealName] = useState<MealName>(isMealName(initialMeal) ? initialMeal : 'LUNCH')
  const [choice, setChoice] = useState<MealChoice>('TAKE')
  const [guestCount, setGuestCount] = useState('1')
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
        const currentMeal = findMeal(mealList, mealName)
        const attendance = findAttendanceForMember(currentMeal, user?.id)
        setMeals(mealList)
        setDeadline((deadlineRes.data ?? null) as MealDeadlineInfo | null)
        setChoice(attendance ? choiceFromAttendance(attendance.status, attendance.guests) : 'TAKE')
        setGuestCount(guestValueFromAttendance(attendance?.guests))
      })
      .catch((error) => {
        if (!alive) return
        setMeals([])
        setDeadline(null)
        setMessage(error instanceof Error ? error.message : 'Failed to load your meal.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, mealName, messId, user?.id])

  const selectedMeal = findMeal(meals, mealName)
  const locked = mealIsLocked(selectedMeal)
  const windowOpen = Boolean(deadline?.isWindowOpen)
  const datePosition = compareIsoDate(date)
  const memberWindowOpen = datePosition === 'future' || (datePosition === 'today' && windowOpen)
  const closedForMember = locked || !memberWindowOpen
  const canSave = Boolean(messId) && (isManager || !closedForMember)
  const statusClosed = !isManager && closedForMember
  const statusText = statusClosed ? 'closed' : 'open'
  const statusDescription = locked
    ? isManager
      ? 'This meal is locked, but managers can still update it.'
      : 'This meal is locked by manager.'
    : datePosition === 'past' && !isManager
      ? 'Previous date meals can only be updated by manager.'
      : datePosition === 'future'
        ? 'Future date meals can be added anytime.'
        : windowOpen || isManager
          ? 'Choose how you want to take this meal.'
          : 'Meal updating time is over.'
  const guestMeals = choice === 'GUEST' ? normalizeGuestMealCount(guestCount) : 0
  const mealCount = choice === 'NO' ? 0 : Number((MEAL_META[mealName].baseValue + guestMeals).toFixed(2))

  function selectGuestMeal() {
    setChoice('GUEST')
    setGuestCount((current) => (Number(current) > 0 ? current : '1'))
  }

  async function saveMeal() {
    if (!messId || !canSave) return
    setSaving(true)
    setMessage('')

    try {
      await api.createMeal({
        messId,
        mealName,
        status: choice === 'NO' ? 'OFF' : 'ON',
        guests: guestMeals,
        mealCount,
        date,
      })

      const [mealRes, deadlineRes] = await Promise.all([
        api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 }),
        api.getMealDeadline(messId, date),
      ])
      setMeals(normalizeMeals(mealRes.data))
      setDeadline((deadlineRes.data ?? null) as MealDeadlineInfo | null)
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
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} onPrevious={() => setDate((current) => shiftIsoDate(current, -1))} onNext={() => setDate((current) => shiftIsoDate(current, 1))} />
        <MealTabs value={mealName} onChange={setMealName} meals={meals} />

        <MealCard className="text-center">
          <MealStateIllustration state={statusClosed ? 'locked' : 'open'} mealName={mealName} />

          <h2 className={`mt-5 text-title font-bold ${statusClosed ? 'text-[#ee1f2f]' : 'text-[#123748]'}`}>
            {MEAL_LABELS[mealName]} meal is {statusText}
          </h2>
          <p className="mt-2 text-label font-semibold text-[#65838b]">{statusDescription}</p>
          <div className="mt-3 inline-flex items-center rounded-full bg-[#edfafa] px-4 py-2 text-caption font-bold text-[#123748]">
            {deadlineLabel(deadline)}
          </div>
        </MealCard>

        {message ? <InlineNotice tone={message.includes('successfully') ? 'success' : 'danger'}>{message}</InlineNotice> : null}

        {loading ? <InlineNotice>Loading current meal preference...</InlineNotice> : null}

        <MealCard className="space-y-2">
          <MealOptionRow
            selected={choice === 'GUEST'}
            title="Guest Meal"
            hint="Adds guest meals with yours"
            rightText="Optional"
            rightSlot={
              choice === 'GUEST' ? (
                <GuestMealCountInput value={guestCount} onChange={setGuestCount} disabled={!canSave || saving} />
              ) : undefined
            }
            onClick={selectGuestMeal}
          />
          <MealOptionRow selected={choice === 'NO'} title="No Meal" hint="You will not take this meal" onClick={() => setChoice('NO')} />
          <MealOptionRow selected={choice === 'TAKE'} title="I will take meal" hint="Your regular meal count" onClick={() => setChoice('TAKE')} />

          <button type="button" className="primary-btn mt-3 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60" onClick={saveMeal} disabled={!canSave || saving}>
            <UtensilsCrossed size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </MealCard>

        {canSave ? (
          <SaveConfirmNote>{isManager ? 'Manager can update meals even after the member deadline.' : datePosition === 'future' ? 'Future date meals can be added or updated anytime.' : 'You can update your meal until the deadline.'}</SaveConfirmNote>
        ) : (
          <InlineNotice tone="warning">
            <Info size={15} className="mr-2 inline align-[-2px]" />
            {datePosition === 'past' ? 'Previous date meals can only be changed by manager.' : 'You can no longer add or update this meal.'}
          </InlineNotice>
        )}

        <MealCard>
          <div className="mb-2 text-label font-semibold text-[#123748]">Your Meal</div>
          <MealStatusPill tone={choice === 'NO' ? 'closed' : 'open'}>{choice === 'NO' ? 'No Meal' : 'I will take meal'}</MealStatusPill>
        </MealCard>
      </div>
    </MobileShell>
  )
}

export default function MyMealPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-body font-semibold text-[#65838b]">Loading...</div>}>
      <MyMealContent />
    </Suspense>
  )
}
