'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealHistoryStats,
  MealHistoryTable,
  MealMonthSelector,
  buildMemberMealHistory,
  currentMonthValue,
  monthBounds,
  normalizeMeals,
  summarizeMealHistory,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'

function initialMonth(value: string | null) {
  return /^\d{4}-\d{2}$/.test(value ?? '') ? (value as string) : currentMonthValue()
}

function MealDetailsContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [month, setMonth] = useState(initialMonth(params.get('month')))
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId) return
    let alive = true
    const range = monthBounds(month)

    setLoading(true)
    setMessage('')
    api
      .getMealsByMess(messId, { startDate: range.startDate, endDate: range.endDate, limit: 300 })
      .then((mealRes) => {
        if (!alive) return
        setMeals(normalizeMeals(mealRes.data))
      })
      .catch((error) => {
        if (!alive) return
        setMeals([])
        setMessage(error instanceof Error ? error.message : 'Failed to load meal history.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month])

  const history = useMemo(() => buildMemberMealHistory(meals, user?.id), [meals, user?.id])
  const summary = useMemo(() => summarizeMealHistory(history), [history])

  return (
    <MobileShell>
      <TopScreen title="My Meal History" backHref="/meals" />
      <div className="screen space-y-5">
        <MealMonthSelector month={month} onChange={setMonth} />

        <MealHistoryStats
          totalMeals={loading ? 0 : summary.totalMeals}
          days={loading ? 0 : summary.days}
          averagePerDay={loading ? 0 : summary.averagePerDay}
        />

        {message ? <InlineNotice tone="danger">{message}</InlineNotice> : null}
        {loading ? <InlineNotice>Loading meal history...</InlineNotice> : null}

        {!loading ? <MealHistoryTable history={history} /> : null}

        <p className="px-2 text-caption font-bold leading-4 text-[#55727b]">* Only meals added within the allowed time are counted.</p>
      </div>
    </MobileShell>
  )
}

export default function MealDetailsPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-body font-semibold text-[#65838b]">Loading...</div>}>
      <MealDetailsContent />
    </Suspense>
  )
}
