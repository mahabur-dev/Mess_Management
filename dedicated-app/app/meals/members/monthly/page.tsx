'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, RotateCw, Users, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { MonthPicker } from '@/components/mobile/date-picker'
import {
  attendanceMealCount,
  currentMonthValue,
  memberName,
  monthBounds,
  normalizeMeals,
  toIsoDateKey,
  todayIsoDate,
  type MealMember,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { useQueryParams } from '@/lib/use-query-params'

type MonthlyMember = {
  id: string
  name: string
}

function mealMemberId(member: MealMember) {
  return member.user?.id ?? member.user_id ?? ''
}

function roundMealCount(value: number) {
  return Number(value.toFixed(2))
}

function datesForMonth(month: string) {
  const range = monthBounds(month)
  const days = Number(range.endDate.slice(8, 10))
  return Array.from({ length: days }, (_item, index) => {
    const day = index + 1
    return {
      day,
      iso: `${range.month}-${String(day).padStart(2, '0')}`,
    }
  })
}

export default function FullMonthMealsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const mealsCopy = useTranslations('meals')
  const common = useTranslations('common')
  const queryParams = useQueryParams()
  const messId = useMemo(() => getActiveMessId(user), [user])
  const [month, setMonth] = useState(currentMonthValue())
  const [members, setMembers] = useState<MealMember[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const requestedMonth = queryParams.get('month')
    if (/^\d{4}-\d{2}$/.test(requestedMonth ?? '')) setMonth(requestedMonth as string)
  }, [queryParams])

  useEffect(() => {
    if (!messId) {
      setMembers([])
      setMeals([])
      setLoading(false)
      setLoadFailed(false)
      return
    }

    let alive = true
    const range = monthBounds(month)
    setLoading(true)
    setLoadFailed(false)

    Promise.all([
      api.getMealMembers(messId),
      api.getMealsByMess(messId, { startDate: range.startDate, endDate: range.endDate, limit: 200 }),
    ])
      .then(([memberResponse, mealResponse]) => {
        if (!alive) return
        setMembers(Array.isArray(memberResponse.data) ? memberResponse.data as MealMember[] : [])
        setMeals(normalizeMeals(mealResponse.data))
      })
      .catch(() => {
        if (!alive) return
        setMembers([])
        setMeals([])
        setLoadFailed(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month, reloadKey])

  const dates = useMemo(() => datesForMonth(month), [month])
  const monthlyMembers = useMemo<MonthlyMember[]>(() => {
    const names = new Map<string, string>()

    members
      .filter((member) => member.is_active !== false)
      .forEach((member) => {
        const id = mealMemberId(member)
        if (id) names.set(id, memberName(member, locale))
      })

    meals.forEach((meal) => {
      meal.attendances?.forEach((attendance) => {
        const id = attendance.member_id ?? attendance.member?.id ?? ''
        if (id && !names.has(id)) names.set(id, attendance.member?.name?.trim() || mealsCopy('unknownMember'))
      })
    })

    return Array.from(names, ([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, locale === 'bn' ? 'bn-BD' : 'en-BD'))
  }, [locale, meals, mealsCopy, members])

  const mealMatrix = useMemo(() => {
    const matrix = new Map<string, Map<string, number>>()

    meals.forEach((meal) => {
      const date = toIsoDateKey(meal.scheduled_date)
      if (!date) return
      const memberMeals = matrix.get(date) ?? new Map<string, number>()
      meal.attendances?.forEach((attendance) => {
        const memberId = attendance.member_id ?? attendance.member?.id ?? ''
        if (!memberId) return
        const next = (memberMeals.get(memberId) ?? 0) + attendanceMealCount(meal.name, attendance)
        memberMeals.set(memberId, roundMealCount(next))
      })
      matrix.set(date, memberMeals)
    })

    return matrix
  }, [meals])

  const memberTotals = useMemo(() => {
    const totals = new Map<string, number>()
    mealMatrix.forEach((memberMeals) => {
      memberMeals.forEach((count, memberId) => {
        totals.set(memberId, roundMealCount((totals.get(memberId) ?? 0) + count))
      })
    })
    return totals
  }, [mealMatrix])

  const monthlyTotal = useMemo(
    () => roundMealCount(Array.from(memberTotals.values()).reduce((sum, count) => sum + count, 0)),
    [memberTotals],
  )
  const activeDays = useMemo(
    () => Array.from(mealMatrix.values()).filter((memberMeals) => Array.from(memberMeals.values()).some((count) => count > 0)).length,
    [mealMatrix],
  )
  const today = todayIsoDate()
  const memberColumnWidth = monthlyMembers.length <= 3 ? 122 : 110
  const tableWidth = 94 + monthlyMembers.length * memberColumnWidth + 76

  return (
    <MobileShell>
      <TopScreen
        title={mealsCopy('fullMonthMeal')}
        subtitle={format.month(`${month}-01`)}
        backHref="/meals/members"
      />

      <div className="screen full-month-meal-page">
        <div className="full-month-meal-toolbar">
          <MonthPicker
            label={mealsCopy('selectMonth')}
            value={month}
            onChange={setMonth}
            renderTrigger={({ open, selectedLabel, buttonProps }) => (
              <button {...buttonProps} className="home-month-pill full-month-picker-trigger">
                <CalendarDays size={15} strokeWidth={2.35} aria-hidden="true" />
                <span>{selectedLabel}</span>
                <ChevronDown size={15} strokeWidth={2.35} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            )}
          />
          <span className="full-month-meal-period">{format.number(dates.length)} {mealsCopy('days')}</span>
        </div>

        {!messId ? <div className="full-month-meal-notice" role="status">{mealsCopy('noMessSelected')}</div> : null}

        {messId ? (
          <section className="full-month-meal-summary" aria-label={mealsCopy('monthlyMealSummary')}>
            <div>
              <Users size={15} aria-hidden="true" />
              <span>{mealsCopy('members')}</span>
              <strong>{format.number(monthlyMembers.length)}</strong>
            </div>
            <div>
              <CalendarDays size={15} aria-hidden="true" />
              <span>{mealsCopy('activeDays')}</span>
              <strong>{format.number(activeDays)}</strong>
            </div>
            <div>
              <UtensilsCrossed size={15} aria-hidden="true" />
              <span>{mealsCopy('totalMeals')}</span>
              <strong>{format.number(monthlyTotal)}</strong>
            </div>
          </section>
        ) : null}

        {loading ? <LoadingIndicator variant="card" label={mealsCopy('loadingMonthlyMeals')} /> : null}

        {!loading && loadFailed ? (
          <div className="full-month-meal-error" role="alert">
            <span>{mealsCopy('loadMonthlyMemberMealsFailed')}</span>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              <RotateCw size={15} aria-hidden="true" /> {common('retry')}
            </button>
          </div>
        ) : null}

        {!loading && !loadFailed && messId && !monthlyMembers.length ? (
          <div className="full-month-meal-empty">
            <Users size={25} aria-hidden="true" />
            <strong>{mealsCopy('noMonthlyMealData')}</strong>
          </div>
        ) : null}

        {!loading && !loadFailed && monthlyMembers.length ? (
          <section className="full-month-meal-table-shell" aria-label={mealsCopy('monthlyMealTable')}>
            <div className="full-month-meal-table-scroll">
              <table className="full-month-meal-table" style={{ minWidth: tableWidth }}>
                <caption className="sr-only">{mealsCopy('monthlyMealTable')}</caption>
                <colgroup>
                  <col style={{ width: 94 }} />
                  {monthlyMembers.map((member) => <col key={member.id} style={{ width: memberColumnWidth }} />)}
                  <col style={{ width: 76 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="full-month-meal-date-column" scope="col">{mealsCopy('date')}</th>
                    {monthlyMembers.map((member) => (
                      <th key={member.id} scope="col" title={member.name}>
                        <span>{member.name}</span>
                      </th>
                    ))}
                    <th className="full-month-meal-total-column" scope="col">{mealsCopy('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((dateItem) => {
                    const dateMeals = mealMatrix.get(dateItem.iso)
                    const dailyTotal = roundMealCount(monthlyMembers.reduce((sum, member) => sum + (dateMeals?.get(member.id) ?? 0), 0))
                    return (
                      <tr key={dateItem.iso} data-today={dateItem.iso === today}>
                        <th className="full-month-meal-date-column" scope="row">
                          <strong>{format.number(dateItem.day, { minimumIntegerDigits: 2, useGrouping: false })}</strong>
                          <span>{format.weekday(dateItem.iso, 'short')}</span>
                        </th>
                        {monthlyMembers.map((member) => {
                          const count = dateMeals?.get(member.id) ?? 0
                          return (
                            <td key={member.id}>
                              <span data-positive={count > 0}>{format.number(count)}</span>
                            </td>
                          )
                        })}
                        <td className="full-month-meal-total-column"><strong>{format.number(dailyTotal)}</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="full-month-meal-date-column" scope="row">{mealsCopy('monthTotal')}</th>
                    {monthlyMembers.map((member) => (
                      <td key={member.id}><strong>{format.number(memberTotals.get(member.id) ?? 0)}</strong></td>
                    ))}
                    <td className="full-month-meal-total-column"><strong>{format.number(monthlyTotal)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </MobileShell>
  )
}
