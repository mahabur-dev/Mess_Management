'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Save, UserRound } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealCard,
  MealCountEditorRow,
  MEAL_META,
  MEAL_ORDER,
  findAttendanceForMember,
  findMeal,
  formatDisplayDate,
  initials,
  normalizeMeals,
  SaveConfirmNote,
  todayIsoDate,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'

type MealCountMap = Record<MealName, string>

function formatMealCount(value: number) {
  return Number(value.toFixed(2)).toString()
}

function defaultMealCounts(): MealCountMap {
  return MEAL_ORDER.reduce((counts, mealName) => {
    counts[mealName] = formatMealCount(MEAL_META[mealName].baseValue)
    return counts
  }, {} as MealCountMap)
}

function mealCountsFromRecords(meals: MealRecord[], memberId: string): MealCountMap {
  return MEAL_ORDER.reduce((counts, mealName) => {
    const attendance = findAttendanceForMember(findMeal(meals, mealName), memberId)
    const count = attendance?.status === 'OFF'
      ? 0
      : MEAL_META[mealName].baseValue + Number(attendance?.guests ?? 0)
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

function EditMemberMealContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const memberId = params.get('memberId') ?? ''
  const memberDisplayName = params.get('name') ?? 'Member'
  const date = params.get('date') || todayIsoDate()
  const [mealCounts, setMealCounts] = useState<MealCountMap>(defaultMealCounts)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId || !memberId) return
    let alive = true
    setLoading(true)
    setMessage('')

    api
      .getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      .then((res) => {
        if (!alive) return
        const mealList = normalizeMeals(res.data)
        setMealCounts(mealCountsFromRecords(mealList, memberId))
      })
      .catch((error) => {
        if (!alive) return
        setMealCounts(defaultMealCounts())
        setMessage(error instanceof Error ? error.message : 'Failed to load member meals.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, memberId, messId])

  function updateMealCount(mealName: MealName, value: string) {
    setMealCounts((current) => ({ ...current, [mealName]: value }))
  }

  function stepMealCount(mealName: MealName, direction: 1 | -1) {
    setMealCounts((current) => ({
      ...current,
      [mealName]: formatMealCount(nextMealCount(mealName, current[mealName], direction)),
    }))
  }

  async function saveMeals() {
    if (!messId || !memberId) {
      setMessage('Member is missing.')
      return
    }

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
            memberId,
            mealName,
            status,
            guests,
            mealCount,
            date,
          })
        }),
      )

      const res = await api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      const mealList = normalizeMeals(res.data)
      setMealCounts(mealCountsFromRecords(mealList, memberId))
      setMessage('All meals updated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update member meals.')
    } finally {
      setSaving(false)
    }
  }

  const activeMeals = MEAL_ORDER.filter((mealName) => normalizeMealCount(mealName, mealCounts[mealName]) > 0).length

  return (
    <MobileShell>
      <TopScreen title="Edit Member Meals" subtitle={formatDisplayDate(date)} backHref="/meals/members" />
      <div className="screen space-y-4">
        <MealCard className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#edfafa] text-label font-bold text-[#008d8c]">
            {initials(memberDisplayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-label font-bold text-[#123748]">{memberDisplayName}</div>
            <div className="mt-1 flex items-center gap-1 text-caption font-bold text-[#65838b]">
              <UserRound size={12} /> {formatDisplayDate(date)}
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-[#edfafa] px-3 py-1.5 text-caption font-bold text-[#00777a]">
            {activeMeals}/3 active
          </div>
        </MealCard>

        {message ? <InlineNotice tone={message.includes('successfully') ? 'success' : 'danger'}>{message}</InlineNotice> : null}
        {loading ? <LoadingIndicator variant="card" label="Loading member meals" /> : null}

        <MealCard className="overflow-hidden p-0">
          <div className="border-b border-[#dce8e9] px-4 py-3">
            <div className="text-body font-bold text-[#123748]">Daily meal plan</div>
            <div className="mt-1 text-caption font-semibold text-[#65838b]">Set all meals before saving this member&apos;s plan.</div>
          </div>
          <div>
            {MEAL_ORDER.map((mealName) => (
              <MealCountEditorRow
                key={mealName}
                mealName={mealName}
                value={mealCounts[mealName]}
                disabled={saving || loading}
                onChange={(value) => updateMealCount(mealName, value)}
                onStep={(direction) => stepMealCount(mealName, direction)}
                onBlur={(value) => updateMealCount(mealName, formatMealCount(normalizeMealCount(mealName, value)))}
              />
            ))}
          </div>
        </MealCard>

        <SaveConfirmNote>All three meal changes will be saved together for this member.</SaveConfirmNote>

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60" onClick={saveMeals} disabled={saving || loading || !memberId}>
          <Save size={18} /> {saving ? 'Saving meals...' : 'Save all meals'}
        </button>
      </div>
    </MobileShell>
  )
}

export default function EditMemberMealPage() {
  return (
    <Suspense fallback={<LoadingIndicator variant="screen" label="Loading member meals" />}>
      <EditMemberMealContent />
    </Suspense>
  )
}
