'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserRound, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  GuestMealCountInput,
  MealCard,
  MEAL_LABELS,
  MEAL_META,
  MEAL_ORDER,
  MealIconBadge,
  MealOptionRow,
  MealStatusPill,
  SaveConfirmNote,
  findAttendanceForMember,
  findMeal,
  formatDisplayDate,
  initials,
  normalizeMeals,
  todayIsoDate,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
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

function EditMemberMealContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const memberId = params.get('memberId') ?? ''
  const memberDisplayName = params.get('name') ?? 'Member'
  const date = params.get('date') || todayIsoDate()
  const mealName: MealName = isMealName(params.get('meal')) ? (params.get('meal') as MealName) : 'LUNCH'
  const [choice, setChoice] = useState<MealChoice>('TAKE')
  const [guestCount, setGuestCount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [meals, setMeals] = useState<MealRecord[]>([])

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)
    setMessage('')

    api
      .getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      .then((res) => {
        if (!alive) return
        const mealList = normalizeMeals(res.data)
        const attendance = findAttendanceForMember(findMeal(mealList, mealName), memberId)
        setMeals(mealList)
        if (attendance) setChoice(choiceFromAttendance(attendance.status, attendance.guests))
        setGuestCount(guestValueFromAttendance(attendance?.guests))
      })
      .catch((error) => {
        if (!alive) return
        setMessage(error instanceof Error ? error.message : 'Failed to load member meal.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, mealName, memberId, messId])

  const attendance = findAttendanceForMember(findMeal(meals, mealName), memberId)
  const guestMeals = choice === 'GUEST' ? normalizeGuestMealCount(guestCount) : 0
  const mealCount = choice === 'NO' ? 0 : Number((MEAL_META[mealName].baseValue + guestMeals).toFixed(2))

  function selectGuestMeal() {
    setChoice('GUEST')
    setGuestCount((current) => (Number(current) > 0 ? current : '1'))
  }

  async function updateMeal() {
    if (!messId || !memberId) {
      setMessage('Member is missing.')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      await api.createMeal({
        messId,
        memberId,
        mealName,
        status: choice === 'NO' ? 'OFF' : 'ON',
        guests: guestMeals,
        mealCount,
        date,
      })

      const res = await api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      setMeals(normalizeMeals(res.data))
      setMessage('Member meal updated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update member meal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Member Meal" subtitle={formatDisplayDate(date)} backHref="/meals/members" />
      <div className="screen space-y-4">
        <MealCard className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#edfafa] text-label font-bold text-[#008d8c]">
            {initials(memberDisplayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-label font-bold text-[#123748]">{memberDisplayName}</div>
            <div className="mt-1 flex items-center gap-1 text-caption font-bold text-[#65838b]">
              <UserRound size={12} /> {MEAL_LABELS[mealName]} - {formatDisplayDate(date)}
            </div>
          </div>
          <MealIconBadge mealName={mealName} />
        </MealCard>

        <MealCard>
          <div className="mb-2 text-label font-semibold text-[#123748]">Current Status</div>
          <MealStatusPill tone={attendance?.status === 'OFF' ? 'closed' : 'open'}>{attendance?.status === 'OFF' ? 'No Meal' : 'I will take meal'}</MealStatusPill>
        </MealCard>

        {message ? <InlineNotice tone={message.includes('successfully') ? 'success' : 'danger'}>{message}</InlineNotice> : null}
        {loading ? <InlineNotice>Loading current status...</InlineNotice> : null}

        <MealCard className="space-y-2">
          <div className="mb-2 text-body font-bold text-[#123748]">Update Meal</div>
          <MealOptionRow
            selected={choice === 'GUEST'}
            title="Guest Meal"
            rightText="Optional"
            rightSlot={
              choice === 'GUEST' ? (
                <GuestMealCountInput value={guestCount} onChange={setGuestCount} disabled={saving} />
              ) : undefined
            }
            onClick={selectGuestMeal}
          />
          <MealOptionRow selected={choice === 'NO'} title="No Meal" onClick={() => setChoice('NO')} />
          <MealOptionRow selected={choice === 'TAKE'} title="I will take meal" onClick={() => setChoice('TAKE')} />
        </MealCard>

        <SaveConfirmNote>Change will be saved instantly for this member.</SaveConfirmNote>

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-60" onClick={updateMeal} disabled={saving}>
          <UtensilsCrossed size={18} /> {saving ? 'Updating...' : 'Update Meal'}
        </button>
      </div>
    </MobileShell>
  )
}

export default function EditMemberMealPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-body font-semibold text-[#65838b]">Loading...</div>}>
      <EditMemberMealContent />
    </Suspense>
  )
}
