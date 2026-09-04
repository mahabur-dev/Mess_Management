'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { apiClient, type AttendanceStatus, type MealName } from '@/lib/api-client'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'

const MEAL_BASE_VALUE: Record<MealName, number> = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 1,
}

type Member = {
  user_id: string
  is_active: boolean
  user?: { name?: string | null }
}

type Attendance = {
  member_id: string
  guests?: number | null
  status: AttendanceStatus
  member?: { id: string; name: string }
}

type Meal = {
  name: MealName
  scheduled_date: string
  attendances?: Attendance[]
}

interface MonthlyMealDrawerProps {
  messId?: string
  members: Member[]
  selectedDate: string
}

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function moveMonth(value: string, amount: number) {
  const [year, month] = value.split('-').map(Number)
  const next = new Date(year, month - 1 + amount, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

function monthDates(value: string) {
  const [year, month] = value.split('-').map(Number)
  const numberOfDays = new Date(year, month, 0).getDate()
  return Array.from({ length: numberOfDays }, (_, index) => {
    const day = index + 1
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const date = new Date(year, month - 1, day)
    return {
      iso,
      day: String(day).padStart(2, '0'),
      weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    }
  })
}

function attendanceMealCount(attendance: Attendance, mealName: MealName) {
  if (attendance.status !== 'ON') return 0
  return Number((MEAL_BASE_VALUE[mealName] + Number(attendance.guests ?? 0)).toFixed(2))
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MonthlyMealDrawer({ messId, members, selectedDate }: MonthlyMealDrawerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(selectedDate.slice(0, 7))
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !messId) return

    let active = true
    const [year, monthNumber] = month.split('-').map(Number)
    const startDate = `${month}-01`
    const endDate = `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0')}`

    setLoading(true)
    setError('')
    apiClient
      .getMealsByMess(messId, { startDate, endDate, limit: 200 })
      .then((response) => {
        if (active) setMeals(Array.isArray(response.data) ? (response.data as Meal[]) : [])
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setMeals([])
        setError(requestError instanceof Error ? requestError.message : 'Unable to load monthly meals.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [messId, month, open])

  const dates = useMemo(() => monthDates(month), [month])
  const drawerMembers = useMemo(() => {
    const memberMap = new Map<string, string>()
    members
      .filter((member) => member.is_active)
      .forEach((member) => memberMap.set(member.user_id, member.user?.name?.trim() || 'Unknown member'))

    meals.forEach((meal) => {
      meal.attendances?.forEach((attendance) => {
        if (!memberMap.has(attendance.member_id)) {
          memberMap.set(attendance.member_id, attendance.member?.name?.trim() || 'Unknown member')
        }
      })
    })

    return Array.from(memberMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [meals, members])

  const mealMatrix = useMemo(() => {
    const matrix = new Map<string, Map<string, number>>()
    meals.forEach((meal) => {
      const isoDate = meal.scheduled_date.slice(0, 10)
      const dateMeals = matrix.get(isoDate) ?? new Map<string, number>()
      meal.attendances?.forEach((attendance) => {
        const count = attendanceMealCount(attendance, meal.name)
        dateMeals.set(attendance.member_id, Number(((dateMeals.get(attendance.member_id) ?? 0) + count).toFixed(2)))
      })
      matrix.set(isoDate, dateMeals)
    })
    return matrix
  }, [meals])

  const memberTotals = useMemo(() => {
    const totals = new Map<string, number>()
    mealMatrix.forEach((dateMeals) => {
      dateMeals.forEach((count, memberId) => totals.set(memberId, Number(((totals.get(memberId) ?? 0) + count).toFixed(2))))
    })
    return totals
  }, [mealMatrix])

  const monthlyTotal = useMemo(
    () => Number(Array.from(memberTotals.values()).reduce((sum, total) => sum + total, 0).toFixed(2)),
    [memberTotals],
  )
  const trackedDays = useMemo(
    () => Array.from(mealMatrix.values()).filter((dateMeals) => Array.from(dateMeals.values()).some((count) => count > 0)).length,
    [mealMatrix],
  )

  const memberColumnWidth = drawerMembers.length <= 2 ? 180 : drawerMembers.length <= 5 ? 156 : 142
  const tableWidth = 148 + drawerMembers.length * memberColumnWidth + 104
  const preferredDrawerWidth = Math.max(590, tableWidth + 48)
  const today = new Date().toISOString().slice(0, 10)

  function openDrawer() {
    setMonth(selectedDate.slice(0, 7))
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        disabled={!messId}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--dashboard-surface)] px-3.5 text-xs font-semibold text-[var(--brand)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:pointer-events-none disabled:opacity-50 sm:h-11 sm:px-4 sm:text-sm"
      >
        <CalendarRange className="size-4" />
        <span className="hidden sm:inline">View full month</span>
        <span className="sm:hidden">Full month</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className="w-[calc(100vw-0.5rem)] max-w-none gap-0 overflow-hidden border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0 shadow-2xl sm:max-w-none"
          style={{ width: `min(${preferredDrawerWidth}px, calc(100vw - 16px))` }}
        >
          <SheetHeader className="shrink-0 border-b border-[var(--dashboard-line)] bg-[linear-gradient(135deg,var(--dashboard-surface),var(--brand-softer))] p-4 pr-14 sm:p-6 sm:pr-16">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <CalendarRange className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Monthly meal register</p>
                <SheetTitle className="text-lg font-semibold tracking-tight sm:text-xl">All member meals</SheetTitle>
                <SheetDescription className="mt-0.5 font-semibold">Daily totals for {monthLabel(month)}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col bg-[var(--dashboard-bg)] p-3 sm:p-5">
            <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3 shadow-[var(--dashboard-shadow)] sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous month" onClick={() => setMonth((current) => moveMonth(current, -1))} className="grid size-9 place-items-center rounded-lg border border-[var(--dashboard-line)] text-muted-foreground transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                  <ChevronLeft className="size-4" />
                </button>
                <EnterpriseMonthPicker value={month} onValueChange={setMonth} surface="white" className="h-9 min-w-[170px] rounded-lg" align="start" />
                <button type="button" aria-label="Next month" onClick={() => setMonth((current) => moveMonth(current, 1))} className="grid size-9 place-items-center rounded-lg border border-[var(--dashboard-line)] text-muted-foreground transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex">
                {[
                  { label: 'Members', value: drawerMembers.length, icon: <Users className="size-3.5" /> },
                  { label: 'Active days', value: trackedDays, icon: <CalendarRange className="size-3.5" /> },
                  { label: 'Total meals', value: monthlyTotal, icon: <UtensilsCrossed className="size-3.5" /> },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[var(--dashboard-surface-subtle)] px-3 py-2 sm:min-w-[96px]">
                    <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{item.icon}{item.label}</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] shadow-[var(--dashboard-shadow)]">
              {loading ? (
                <div className="grid h-full min-h-56 place-items-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Loader2 className="size-4 animate-spin text-[var(--brand)]" /> Loading monthly meals...</div>
                </div>
              ) : error ? (
                <div className="grid h-full min-h-56 place-items-center p-6 text-center text-sm font-semibold text-rose-600">{error}</div>
              ) : drawerMembers.length === 0 ? (
                <div className="grid h-full min-h-56 place-items-center p-6 text-center"><div><Users className="mx-auto mb-2 size-7 text-muted-foreground" /><p className="text-sm font-semibold text-foreground">No active members found</p><p className="mt-1 text-xs font-medium text-muted-foreground">Members will appear here when they join this mess.</p></div></div>
              ) : (
                <div className="h-full overflow-auto [scrollbar-gutter:stable]">
                  <table className="w-full border-separate border-spacing-0" style={{ minWidth: tableWidth }}>
                    <colgroup>
                      <col style={{ width: 148 }} />
                      {drawerMembers.map((member) => <col key={member.id} style={{ width: memberColumnWidth }} />)}
                      <col style={{ width: 104 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="sticky left-0 top-0 z-30 border-b border-r border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Date</th>
                        {drawerMembers.map((member) => (
                          <th key={member.id} className="sticky top-0 z-20 border-b border-r border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-3 py-2.5 text-left">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[10px] font-semibold text-[var(--brand)]">{initials(member.name)}</span>
                              <span className="min-w-0 truncate text-xs font-semibold text-foreground" title={member.name}>{member.name}</span>
                            </div>
                          </th>
                        ))}
                        <th className="sticky right-0 top-0 z-30 border-b border-[var(--dashboard-line)] bg-[var(--brand-softer)] px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">Daily total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dates.map((dateItem) => {
                        const dateMeals = mealMatrix.get(dateItem.iso)
                        const dailyTotal = Number(drawerMembers.reduce((sum, member) => sum + (dateMeals?.get(member.id) ?? 0), 0).toFixed(2))
                        const isToday = dateItem.iso === today
                        return (
                          <tr key={dateItem.iso} className="group hover:bg-[var(--dashboard-hover)]">
                            <th className={`sticky left-0 z-10 border-b border-r border-[var(--dashboard-line)] px-3 py-2.5 text-left group-hover:bg-[var(--dashboard-hover)] ${isToday ? 'bg-[var(--brand-softer)]' : 'bg-[var(--dashboard-surface)]'}`}>
                              <span className={`inline-flex min-w-8 items-center justify-center rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${isToday ? 'bg-[var(--brand)] text-white' : 'bg-[var(--dashboard-surface-subtle)] text-foreground'}`}>{dateItem.day}</span>
                              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{dateItem.weekday}</span>
                            </th>
                            {drawerMembers.map((member) => {
                              const count = dateMeals?.get(member.id) ?? 0
                              return (
                                <td key={member.id} className="border-b border-r border-[var(--dashboard-line)] px-3 py-2.5 text-center">
                                  <span className={`inline-flex h-7 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums ${count > 0 ? 'bg-[var(--brand-soft)] text-[var(--brand-dark)] dark:text-[var(--brand-bright)]' : 'text-muted-foreground/60'}`}>{count}</span>
                                </td>
                              )
                            })}
                            <td className="sticky right-0 z-10 border-b border-[var(--dashboard-line)] bg-[var(--brand-softer)] px-3 py-2.5 text-center group-hover:bg-[var(--brand-soft)]">
                              <span className="text-xs font-semibold tabular-nums text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">{dailyTotal}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th className="sticky bottom-0 left-0 z-30 border-r border-t border-[var(--brand-border)] bg-[var(--dashboard-ink)] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-white">Month total</th>
                        {drawerMembers.map((member) => (
                          <td key={member.id} className="sticky bottom-0 z-20 border-r border-t border-[var(--brand-border)] bg-[var(--dashboard-ink)] px-3 py-3 text-center text-xs font-semibold tabular-nums text-white">{memberTotals.get(member.id) ?? 0}</td>
                        ))}
                        <td className="sticky bottom-0 right-0 z-30 border-t border-[var(--brand-border)] bg-[var(--brand)] px-3 py-3 text-center text-sm font-semibold tabular-nums text-white">{monthlyTotal}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <p className="mt-2 flex shrink-0 items-center gap-1.5 px-1 text-[10px] font-medium text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]" /> Each cell shows that member&apos;s combined breakfast, lunch and dinner for the day. Scroll horizontally when more members are shown.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
