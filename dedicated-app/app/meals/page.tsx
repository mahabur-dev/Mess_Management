'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Clock3, Settings2, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealCard,
  MEAL_ORDER,
  MealStatusPill,
  MealTotalsGrid,
  currentMonthValue,
  deadlineLabel,
  findAttendanceForMember,
  findMeal,
  mealLabel,
  normalizeMeals,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { canManageMess } from '@/lib/app-permissions'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'
import { useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

function nextIsoDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}

export default function MealsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const mealCopy = useTranslations('meals')
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const today = useMemo(() => todayIsoDate(), [])
  const tomorrow = useMemo(() => nextIsoDate(today), [today])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [decisionMeals, setDecisionMeals] = useState<MealRecord[]>([])
  const [decisionDate, setDecisionDate] = useState(tomorrow)
  const [deadline, setDeadline] = useState<MealDeadlineInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')
  const month = currentMonthValue()

  useEffect(() => {
    if (!messId) {
      setMeals([])
      setDecisionMeals([])
      setDecisionDate(tomorrow)
      setDeadline(null)
      setLoading(false)
      showMessage('noMessSelected', 'warning')
      return
    }
    let alive = true

    setLoading(true)
    clearNotice()
    Promise.all([
      api.getMealsByMess(messId, { startDate: today, endDate: today, limit: 20 }),
      api.getMealsByMess(messId, { startDate: tomorrow, endDate: tomorrow, limit: 20 }),
      api.getMealDeadline(messId, today),
      api.getMealDeadline(messId, tomorrow),
    ])
      .then(([todayMealRes, tomorrowMealRes, todayDeadlineRes, tomorrowDeadlineRes]) => {
        if (!alive) return
        const todayDeadline = (todayDeadlineRes.data ?? null) as MealDeadlineInfo | null
        const tomorrowDeadline = (tomorrowDeadlineRes.data ?? null) as MealDeadlineInfo | null
        const isTodayWindowOpen = Boolean(todayDeadline?.isWindowOpen)

        setMeals(normalizeMeals(todayMealRes.data))
        setDecisionMeals(normalizeMeals(isTodayWindowOpen ? todayMealRes.data : tomorrowMealRes.data))
        setDecisionDate(isTodayWindowOpen ? today : tomorrow)
        setDeadline(isTodayWindowOpen ? todayDeadline : tomorrowDeadline)
      })
      .catch((error) => {
        if (!alive) return
        setMeals([])
        setDecisionMeals([])
        setDecisionDate(tomorrow)
        setDeadline(null)
        showError(error, 'loadDashboardFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clearNotice, messId, showError, showMessage, today, tomorrow])

  const selectedMeals = MEAL_ORDER.map((mealName) => {
    const meal = findMeal(decisionMeals, mealName)
    const attendance = findAttendanceForMember(meal, user?.id)
    return { mealName, meal, attendance }
  }).filter((item) => item.attendance?.status === 'ON')
  const selectedMealLabel = selectedMeals.length
    ? selectedMeals.map((item) => mealLabel(item.mealName, locale)).join(', ')
    : mealCopy('noMealSelected')
  return (
    <MobileShell>
      <TopScreen title={mealCopy('management')} subtitle={user?.memberships?.[0]?.mess?.name ?? mealCopy('messMeals')} backHref="/" />
      <div className="screen space-y-4">
        <MealCard className="space-y-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="section-title mb-0">{mealCopy('todayOverview')}</div>
            <Link href={appHref(`/meals/details?month=${month}`)} className="full-month-meal-link">
              <UtensilsCrossed size={16} strokeWidth={2.25} aria-hidden="true" />
              <span>{mealCopy('myTotalMeals')}</span>
            </Link>
          </div>
          {loading ? (
            <LoadingIndicator variant="card" label={mealCopy('loadingMeals')} />
          ) : (
            <MealTotalsGrid meals={meals} />
          )}
        </MealCard>

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

        <MealCard>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-body font-semibold text-[#123748]">{mealCopy('myMealStatus')}</div>
              {deadline ? (
                <div className="mt-1 flex items-center gap-1 text-caption font-semibold text-[#008d8c]">
                  <Clock3 size={12} /> {deadlineLabel(deadline, locale)}
                </div>
              ) : (
                <span className="mt-1 block h-4" aria-hidden="true" />
              )}
            </div>
            {deadline ? (
              <MealStatusPill tone={deadline.isWindowOpen ? 'open' : 'closed'}>{deadline.isWindowOpen ? mealCopy('open') : mealCopy('closed')}</MealStatusPill>
            ) : (
              <span className="block h-7 min-w-[72px]" aria-hidden="true" />
            )}
          </div>

          <div className="rounded-[16px] border border-[#cfeeed] bg-[#fbffff] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-label font-semibold text-[#123748]">{selectedMealLabel}</div>
                <div className="mt-1 text-label text-[#65838b]">{selectedMeals.length ? mealCopy('mealAdded') : mealCopy('updatePreference')}</div>
              </div>
              <MealStatusPill tone={selectedMeals.length ? 'open' : 'neutral'}>
                {selectedMeals.length ? mealCopy('added') : mealCopy('pending')}
              </MealStatusPill>
            </div>
          </div>

          <Link href={appHref(`/meals/my?date=${decisionDate}`)} className="primary-btn mt-4 flex items-center justify-center gap-2">
            <UtensilsCrossed size={18} /> {mealCopy('addMyMeal')}
          </Link>
        </MealCard>

        {isManager ? (
          <Link href={appHref('/meals/manager')} className="meal-manager-link flex min-h-[78px] items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#fff8e9] text-[#e29a16]">
              <Settings2 size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-body font-semibold text-[#123748]">{mealCopy('managerControls')}</div>
              <div className="mt-1 text-label text-[#65838b]">{mealCopy('manageTimeLocksMembers')}</div>
            </div>
          </Link>
        ) : null}
      </div>
    </MobileShell>
  )
}
