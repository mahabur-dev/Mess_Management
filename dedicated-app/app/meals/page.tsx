'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Clock3, Settings2, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealCard,
  MealDateCard,
  MEAL_LABELS,
  MEAL_ORDER,
  MealStatusPill,
  MealTotalsGrid,
  deadlineLabel,
  findAttendanceForMember,
  findMeal,
  mealIsLocked,
  normalizeMeals,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { canManageMess } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

export default function MealsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [date, setDate] = useState(todayIsoDate())
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [deadline, setDeadline] = useState<MealDeadlineInfo | null>(null)
  const [loading, setLoading] = useState(false)
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
        setMeals(normalizeMeals(mealRes.data))
        setDeadline((deadlineRes.data ?? null) as MealDeadlineInfo | null)
      })
      .catch((error) => {
        if (!alive) return
        setMeals([])
        setDeadline(null)
        setMessage(error instanceof Error ? error.message : 'Failed to load meal dashboard.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, messId])

  const activeMeal = MEAL_ORDER.map((mealName) => {
    const meal = findMeal(meals, mealName)
    const attendance = findAttendanceForMember(meal, user?.id)
    return { mealName, meal, attendance }
  }).find((item) => item.attendance)

  return (
    <MobileShell>
      <TopScreen title="Meal Management" subtitle={user?.memberships?.[0]?.mess?.name ?? 'Mess meals'} />

      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />

        <MealCard>
          <div className="mb-3 flex items-center justify-between">
            <div className="section-title mb-0">Today Overview</div>
            <MealStatusPill tone={deadline?.isWindowOpen ? 'open' : 'neutral'}>{deadline?.isWindowOpen ? 'Open' : 'Closed'}</MealStatusPill>
          </div>
          {loading ? (
            <div className="rounded-[18px] bg-[#edfafa] p-6 text-center text-sm font-bold text-[#65838b]">Loading meals...</div>
          ) : (
            <MealTotalsGrid meals={meals} />
          )}
        </MealCard>

        {message ? <InlineNotice tone="danger">{message}</InlineNotice> : null}

        <MealCard>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px] font-black text-[#123748]">My Meal Status</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#008d8c]">
                <Clock3 size={12} /> {deadlineLabel(deadline)}
              </div>
            </div>
            <MealStatusPill tone={deadline?.isWindowOpen ? 'open' : 'closed'}>{deadline?.isWindowOpen ? 'Open' : 'Closed'}</MealStatusPill>
          </div>

          <div className="rounded-[16px] border border-[#cfeeed] bg-[#fbffff] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-black text-[#123748]">{activeMeal ? MEAL_LABELS[activeMeal.mealName] : 'No meal selected'}</div>
                <div className="mt-1 text-[11px] font-semibold text-[#65838b]">{activeMeal?.attendance?.status === 'ON' ? 'Your meal is added' : 'Update your meal preference'}</div>
              </div>
              <MealStatusPill tone={activeMeal?.attendance?.status === 'ON' ? 'open' : 'neutral'}>
                {activeMeal?.attendance?.status === 'ON' ? 'Added' : 'Pending'}
              </MealStatusPill>
            </div>
          </div>

          <Link href={`/meals/my?date=${date}`} className="primary-btn mt-4 flex items-center justify-center gap-2">
            <UtensilsCrossed size={18} /> Add My Meal
          </Link>
        </MealCard>

        <div className="space-y-2.5">
          {MEAL_ORDER.map((mealName) => {
            const meal = findMeal(meals, mealName)
            return (
              <Link key={mealName} href={`/meals/my?date=${date}&meal=${mealName}`} className="flex min-h-[64px] items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(18,55,72,0.06)]">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black text-[#123748]">{MEAL_LABELS[mealName]}</div>
                  <div className="mt-1 text-[11px] font-semibold text-[#65838b]">{mealIsLocked(meal) ? 'Locked by manager' : 'Tap to update your meal'}</div>
                </div>
                <MealStatusPill tone={mealIsLocked(meal) ? 'closed' : 'open'}>{mealIsLocked(meal) ? 'Locked' : 'Open'}</MealStatusPill>
                <ChevronRight size={17} className="text-[#789096]" />
              </Link>
            )
          })}
        </div>

        {isManager ? (
          <Link href="/meals/manager" className="flex min-h-[78px] items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(18,55,72,0.06)]">
            <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#fff8e9] text-[#e29a16]">
              <Settings2 size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-black text-[#123748]">Manager Controls</div>
              <div className="mt-1 text-[11px] font-semibold leading-4 text-[#65838b]">Manage meal time, locks and members meals</div>
            </div>
            <ChevronRight size={17} className="text-[#789096]" />
          </Link>
        ) : null}
      </div>
    </MobileShell>
  )
}
