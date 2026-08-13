'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Clock3, Settings2, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealCard,
  MEAL_LABELS,
  MEAL_ORDER,
  MealStatusPill,
  MealTotalsGrid,
  MonthlyMealSummaryCard,
  buildMemberMealHistory,
  currentMonthValue,
  deadlineLabel,
  findAttendanceForMember,
  findMeal,
  monthBounds,
  normalizeMeals,
  summarizeMealHistory,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { canManageMess } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

export default function MealsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const date = useMemo(() => todayIsoDate(), [])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [monthlyMeals, setMonthlyMeals] = useState<MealRecord[]>([])
  const [deadline, setDeadline] = useState<MealDeadlineInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [message, setMessage] = useState('')
  const month = currentMonthValue()

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

  useEffect(() => {
    if (!messId) return
    let alive = true
    const range = monthBounds(month)

    setMonthlyLoading(true)
    api
      .getMealsByMess(messId, { startDate: range.startDate, endDate: range.endDate, limit: 200 })
      .then((mealRes) => {
        if (!alive) return
        setMonthlyMeals(normalizeMeals(mealRes.data))
      })
      .catch(() => {
        if (!alive) return
        setMonthlyMeals([])
      })
      .finally(() => {
        if (alive) setMonthlyLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month])

  const selectedMeals = MEAL_ORDER.map((mealName) => {
    const meal = findMeal(meals, mealName)
    const attendance = findAttendanceForMember(meal, user?.id)
    return { mealName, meal, attendance }
  }).filter((item) => item.attendance?.status === 'ON')
  const selectedMealLabel = selectedMeals.length
    ? selectedMeals.map((item) => MEAL_LABELS[item.mealName]).join(', ')
    : 'No meal selected'
  const monthlySummary = summarizeMealHistory(buildMemberMealHistory(monthlyMeals, user?.id))

  return (
    <MobileShell>
      <TopScreen title="Meal Management" subtitle={user?.memberships?.[0]?.mess?.name ?? 'Mess meals'} backHref="/" />
      <div className="screen space-y-4">
        <MealCard className="space-y-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="section-title mb-0">Today Overview</div>
            <MealStatusPill tone={deadline?.isWindowOpen ? 'open' : 'neutral'}>{deadline?.isWindowOpen ? 'Open' : 'Closed'}</MealStatusPill>
          </div>
          {loading ? (
            <LoadingIndicator variant="card" label="Loading meals" />
          ) : (
            <MealTotalsGrid meals={meals} />
          )}

          <MonthlyMealSummaryCard
            total={monthlyLoading ? <LoadingIndicator size="sm" label="Loading monthly meals" /> : monthlySummary.totalMeals}
            href={`/meals/details?month=${month}`}
          />
        </MealCard>

        {message ? <InlineNotice tone="danger">{message}</InlineNotice> : null}

        <MealCard>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-body font-bold text-[#123748]">My Meal Status</div>
              <div className="mt-1 flex items-center gap-1 text-caption font-bold text-[#008d8c]">
                <Clock3 size={12} /> {deadlineLabel(deadline)}
              </div>
            </div>
            <MealStatusPill tone={deadline?.isWindowOpen ? 'open' : 'closed'}>{deadline?.isWindowOpen ? 'Open' : 'Closed'}</MealStatusPill>
          </div>

          <div className="rounded-[16px] border border-[#cfeeed] bg-[#fbffff] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-label font-bold text-[#123748]">{selectedMealLabel}</div>
                <div className="mt-1 text-label text-[#65838b]">{selectedMeals.length ? 'Your meal is added' : 'Update your meal preference'}</div>
              </div>
              <MealStatusPill tone={selectedMeals.length ? 'open' : 'neutral'}>
                {selectedMeals.length ? 'Added' : 'Pending'}
              </MealStatusPill>
            </div>
          </div>

          <Link href={appHref(`/meals/my?date=${date}`)} className="primary-btn mt-4 flex items-center justify-center gap-2">
            <UtensilsCrossed size={18} /> Add My Meal
          </Link>
        </MealCard>

        {isManager ? (
          <Link href={appHref('/meals/manager')} className="app-action-row flex min-h-[78px] items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#fff8e9] text-[#e29a16]">
              <Settings2 size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-body font-bold text-[#123748]">Manager Controls</div>
              <div className="mt-1 text-label text-[#65838b]">Manage meal time, locks and members meals</div>
            </div>
            <ChevronRight size={17} className="text-[#789096]" />
          </Link>
        ) : null}
      </div>
    </MobileShell>
  )
}
