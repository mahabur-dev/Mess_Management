'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  CreditCard,
  Landmark,
  MessageSquareWarning,
  ReceiptText,
  Shield,
  Users,
  UtensilsCrossed,
  Wallet2,
  Coins,
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { getHomeQuickActions } from '@/lib/app-permissions'
import { appHref } from '@/lib/routes'
import { useAuth } from './providers'

type DashboardNotice = {
  id: string
  title: string
  created_at: string
}

type DashboardSummary = {
  todayTotalMeals?: number
  totalMeals?: number
  currentMonthTotalBazar?: number
  extraExpenses?: number
  perExtraExpenses?: number
  currentMealRate?: number
  totalDue?: number
  totalDepositAmount?: number
  paidAmount?: number
  activeMembers?: number
  pendingPayments?: number
  openComplaints?: number
  totalRoomRent?: number
  totalCost?: number
  notices?: DashboardNotice[]
}

type MessSummary = {
  id: string
  name: string
}

type MonthlyOverviewPoint = {
  day: string
  income: number
  expense: number
}

type WeeklyPoint = {
  label: string
  income: number
  expense: number
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '--'
  return `${String.fromCodePoint(0x09f3)} ${Number(value).toLocaleString('en-US')}`
}

function monthLabelFromNow() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function buildWeeklyChart(points: MonthlyOverviewPoint[]): WeeklyPoint[] {
  const weeks: WeeklyPoint[] = [
    { label: 'Wk 1', income: 0, expense: 0 },
    { label: 'Wk 2', income: 0, expense: 0 },
    { label: 'Wk 3', income: 0, expense: 0 },
    { label: 'Wk 4', income: 0, expense: 0 },
  ]

  for (const point of points) {
    const dayNumber = Number(point.day.slice(0, 2))
    if (!dayNumber || Number.isNaN(dayNumber)) continue
    const weekIndex = Math.min(3, Math.floor((dayNumber - 1) / 7))
    weeks[weekIndex].income += Number(point.income ?? 0)
    weeks[weekIndex].expense += Number(point.expense ?? 0)
  }

  return weeks.map((week) => ({
    ...week,
    income: Number(week.income.toFixed(2)),
    expense: Number(week.expense.toFixed(2)),
  }))
}

function MiniLineChart({ points }: { points: WeeklyPoint[] }) {
  const width = 320
  const height = 150
  const paddingX = 18
  const paddingTop = 16
  const paddingBottom = 28

  const maxValue = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]))
  const stepX = (width - paddingX * 2) / Math.max(points.length - 1, 1)
  const chartHeight = height - paddingTop - paddingBottom

  const buildPath = (selector: keyof WeeklyPoint) =>
    points
      .map((point, index) => {
        const x = paddingX + index * stepX
        const y = paddingTop + chartHeight - (Number(point[selector]) / maxValue) * chartHeight
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')

  const pointsFor = (selector: keyof WeeklyPoint) =>
    points.map((point, index) => {
      const x = paddingX + index * stepX
      const y = paddingTop + chartHeight - (Number(point[selector]) / maxValue) * chartHeight
      return { x, y }
    })

  const incomePoints = pointsFor('income')
  const expensePoints = pointsFor('expense')

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[150px] w-full">
        <defs>
          <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0aa0a0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0aa0a0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4bbfc0" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#4bbfc0" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="18" y1={height - paddingBottom} x2={width - 18} y2={height - paddingBottom} stroke="#cfeeed" strokeWidth="1.2" />

        <path d={`${buildPath('income')} L ${width - paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`} fill="url(#incomeFill)" />
        <path d={`${buildPath('expense')} L ${width - paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`} fill="url(#expenseFill)" />

        <path d={buildPath('income')} fill="none" stroke="#0aa0a0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={buildPath('expense')} fill="none" stroke="#4bbfc0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

        {incomePoints.map((point, index) => (
          <circle key={`income-${index}`} cx={point.x} cy={point.y} r="3.1" fill="#0aa0a0" stroke="#ffffff" strokeWidth="2" />
        ))}
        {expensePoints.map((point, index) => (
          <circle key={`expense-${index}`} cx={point.x} cy={point.y} r="3.1" fill="#4bbfc0" stroke="#ffffff" strokeWidth="2" />
        ))}
      </svg>

      <div className="mt-1 grid grid-cols-4 text-center text-caption font-medium text-[#65838b]">
        {points.map((point) => (
          <div key={point.label}>{point.label}</div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [monthlyOverview, setMonthlyOverview] = useState<MonthlyOverviewPoint[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [activeMess, setActiveMess] = useState<MessSummary | null>(null)

  const greetingName = user?.name?.split(' ')[0] || 'Manager'
  const chartPoints = useMemo(() => buildWeeklyChart(monthlyOverview), [monthlyOverview])
  const currentMonthLabel = monthLabelFromNow()
  const quickActions = getHomeQuickActions(user)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (!user) return

    const membershipMess = user.memberships?.find((membership) => membership.mess)?.mess ?? null
    if (membershipMess) {
      setActiveMess(membershipMess)
      return
    }

    let cancelled = false
    api
      .getMesses()
      .then((res) => {
        const firstMess = Array.isArray(res.data) ? (res.data[0] as MessSummary | undefined) : undefined
        if (!cancelled) setActiveMess(firstMess ?? null)
      })
      .catch(() => {
        if (!cancelled) setActiveMess(null)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!activeMess?.id) {
      setSummary(null)
      setMonthlyOverview([])
      return
    }

    let cancelled = false
    setSummaryLoading(true)
    api
      .getMessDashboard(activeMess.id)
      .then((res) => {
        if (!cancelled) setSummary(res.data)
      })
      .catch(() => {
        if (!cancelled) setSummary(null)
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeMess?.id])

  useEffect(() => {
    if (!activeMess?.id) return

    let cancelled = false
    setChartLoading(true)
    api
      .getMonthlyOverview(activeMess.id)
      .then((res) => {
        if (!cancelled) setMonthlyOverview(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setMonthlyOverview([])
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeMess?.id])

  const cards = [
    { label: 'Total Member', value: summaryLoading ? '...' : summary?.activeMembers ?? '--', icon: Users, color: '#008d8c' },
    { label: 'Today Meal', value: summaryLoading ? '...' : summary?.todayTotalMeals ?? '--', icon: UtensilsCrossed, color: '#4bbfc0' },
    { label: 'Total Meals', value: summaryLoading ? '...' : summary?.totalMeals ?? '--', icon: ReceiptText, color: '#0aa0a0' },
    {
      label: 'Meal Rate',
      value: summaryLoading ? '...' : summary?.currentMealRate != null ? `${String.fromCodePoint(0x09f3)} ${summary.currentMealRate}` : '--',
      icon: Wallet2,
      color: '#008d8c',
    },
    { label: 'Food Expenses', value: summaryLoading ? '...' : formatMoney(summary?.currentMonthTotalBazar), icon: CreditCard, color: '#00777a' },
    { label: 'Utility Expenses', value: summaryLoading ? '...' : formatMoney(summary?.extraExpenses), icon: Landmark, color: '#0aa0a0' },
    { label: 'Per Member Utility', value: summaryLoading ? '...' : formatMoney(summary?.perExtraExpenses), icon: Coins, color: '#0aa0a0' },
    { label: 'Total Deposit', value: summaryLoading ? '...' : formatMoney(summary?.totalDepositAmount), icon: ClipboardList, color: '#4bbfc0' },
    { label: 'Due Amount', value: summaryLoading ? '...' : formatMoney(summary?.totalDue), icon: MessageSquareWarning, color: '#00777a' },
    {
      label: 'Remaining Amount',
      value: summaryLoading ? '...' : formatMoney((summary?.totalDepositAmount ?? 0) - (summary?.totalDue ?? 0)),
      icon: Shield,
      color: '#008d8c',
    },
  ]

  if (isLoading || !user) {
    return <div className="grid min-h-screen place-items-center text-body font-semibold text-[#65838b]">Loading...</div>
  }

  return (
    <MobileShell>
      <AppHeader
        title={`Good Morning, ${greetingName}`}
        subtitle="Here's what's happening today"
        hasUnreadNotices={Boolean(summary?.notices?.length)}
      />

      <div className="screen -mt-4">
        <div className="quick-actions-card">
          <div className="grid grid-cols-3 gap-1.5">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => router.push(appHref(href))}
                className="quick-action-button"
              >
                <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
                  <Icon size={19} />
                </div>
                <div className="text-label font-semibold text-[#123748]">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <section className="mt-4 rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,119,122,0.08)]">
          <div className="section-title">Overview</div>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="overview-card">
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ backgroundColor: `${card.color}12`, color: card.color }}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="overview-card-label">{card.label}</div>
                      <div className="overview-card-value">{card.value}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-4 rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,119,122,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-label font-bold uppercase tracking-[0.12em] text-[#65838b]">Monthly Overview</div>
              <div className="mt-1 text-caption text-[#65838b]">{currentMonthLabel}</div>
            </div>
            <div className="flex items-center gap-3 text-caption font-bold text-[#65838b]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#0aa0a0]" />
                Income
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#4bbfc0]" />
                Expense
              </span>
            </div>
          </div>

          <div className="chart-frame mt-3">
            {chartLoading ? (
              <div className="flex h-[178px] items-center justify-center text-label font-semibold text-[#65838b]">Loading chart...</div>
            ) : (
              <MiniLineChart points={chartPoints} />
            )}
          </div>
        </section>
      </div>
    </MobileShell>
  )
}
