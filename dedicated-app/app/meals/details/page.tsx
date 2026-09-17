'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
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
import { useLocalizedNotice, useTranslations } from '@/lib/i18n'

function initialMonth(value: string | null) {
  return /^\d{4}-\d{2}$/.test(value ?? '') ? (value as string) : currentMonthValue()
}

function MealDetailsContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const mealCopy = useTranslations('meals')
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [month, setMonth] = useState(initialMonth(params.get('month')))
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    if (!messId) {
      setMeals([])
      setLoading(false)
      showMessage('noMessSelected', 'warning')
      return
    }
    let alive = true
    const range = monthBounds(month)

    setLoading(true)
    clearNotice()
    api
      .getMealsByMess(messId, { startDate: range.startDate, endDate: range.endDate, limit: 300 })
      .then((mealRes) => {
        if (!alive) return
        setMeals(normalizeMeals(mealRes.data))
      })
      .catch((error) => {
        if (!alive) return
        setMeals([])
        showError(error, 'loadHistoryFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clearNotice, messId, month, showError, showMessage])

  const history = useMemo(() => buildMemberMealHistory(meals, user?.id), [meals, user?.id])
  const summary = useMemo(() => summarizeMealHistory(history), [history])

  return (
    <MobileShell>
      <TopScreen title={mealCopy('myMealHistory')} backHref="/meals" />
      <div className="screen space-y-5">
        <MealMonthSelector month={month} onChange={setMonth} />

        {loading ? (
          <LoadingIndicator variant="card" label={mealCopy('loadingHistory')} />
        ) : (
          <MealHistoryStats
            totalMeals={summary.totalMeals}
            days={summary.days}
            averagePerDay={summary.averagePerDay}
          />
        )}

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
        {!loading ? <MealHistoryTable history={history} /> : null}

        <p className="px-2 text-caption font-semibold leading-4 text-[#55727b]">* {mealCopy('allowedMealsNote')}</p>
      </div>
    </MobileShell>
  )
}

export default function MealDetailsPage() {
  const meals = useTranslations('meals')
  return (
    <Suspense fallback={<LoadingIndicator variant="screen" label={meals('loadingHistory')} />}>
      <MealDetailsContent />
    </Suspense>
  )
}
