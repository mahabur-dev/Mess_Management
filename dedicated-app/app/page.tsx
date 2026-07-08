'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ClipboardList,
  CreditCard,
  Shield,
  Users,
  UtensilsCrossed,
  Wallet2,
  Landmark,
  MessageSquareWarning,
  ReceiptText,
  Coins,
} from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
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

type QuickAction = {
  href: string
  label: string
  icon: typeof Users
  tone: 'teal' | 'green' | 'amber' | 'blue' | 'violet' | 'slate'
}

const quickActions: QuickAction[] = [
  { href: '/add-member', label: 'Add Member', icon: Users, tone: 'teal' },
  { href: '/add-expense', label: 'Add Expense', icon: CreditCard, tone: 'green' },
  { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed, tone: 'amber' },
  { href: '/deposits', label: 'Add Deposit', icon: Coins, tone: 'blue' },
  { href: '/notices', label: 'Send Notice', icon: ClipboardList, tone: 'violet' },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: Landmark, tone: 'slate' },
]

const toneClass: Record<QuickAction['tone'], string> = {
  teal: 'bg-[#fff1e6] text-[#fc782d]',
  green: 'bg-[#e8f7ed] text-[#16a34a]',
  amber: 'bg-[#fff4e5] text-[#f59e0b]',
  blue: 'bg-[#e9f1ff] text-[#2563eb]',
  violet: 'bg-[#f2ecff] text-[#7c3aed]',
  slate: 'bg-[#edf3f7] text-[#4b6478]',
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '--'
  return `৳ ${Number(value).toLocaleString('en-US')}`
}

function monthLabelFromNow() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function buildWeeklyChart(points: MonthlyOverviewPoint[]): WeeklyPoint[] {
  const weeks: WeeklyPoint[] = [
    { label: 'Week 1', income: 0, expense: 0 },
    { label: 'Week 2', income: 0, expense: 0 },
    { label: 'Week 3', income: 0, expense: 0 },
    { label: 'Week 4', income: 0, expense: 0 },
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
  const paddingTop = 18
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
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="18" y1={height - paddingBottom} x2={width - 18} y2={height - paddingBottom} stroke="#e5edf2" strokeWidth="1.2" />

        <path d={`${buildPath('income')} L ${width - paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`} fill="url(#incomeFill)" />
        <path d={`${buildPath('expense')} L ${width - paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`} fill="url(#expenseFill)" />

        <path d={buildPath('income')} fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={buildPath('expense')} fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

        {incomePoints.map((point, index) => (
          <circle key={`income-${index}`} cx={point.x} cy={point.y} r="3.2" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
        ))}
        {expensePoints.map((point, index) => (
          <circle key={`expense-${index}`} cx={point.x} cy={point.y} r="3.2" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
        ))}
      </svg>

      <div className="mt-1 grid grid-cols-4 text-center text-[11px] font-medium text-[#6a7f8b]">
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

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
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
    { label: 'Total Member', value: summaryLoading ? '...' : summary?.activeMembers ?? '--', icon: Users, color: '#2f80ed' },
    { label: 'Today Meal', value: summaryLoading ? '...' : summary?.todayTotalMeals ?? '--', icon: UtensilsCrossed, color: '#f59e0b' },
    { label: 'Total Meals', value: summaryLoading ? '...' : summary?.totalMeals ?? '--', icon: ReceiptText, color: '#10b981' },
    { label: 'Meal Rate', value: summaryLoading ? '...' : summary?.currentMealRate != null ? `৳ ${summary.currentMealRate}` : '--', icon: Wallet2, color: '#fc782d' },
    { label: 'Food Expenses', value: summaryLoading ? '...' : formatMoney(summary?.currentMonthTotalBazar), icon: CreditCard, color: '#ef4444' },
    { label: 'Utility Expenses', value: summaryLoading ? '...' : formatMoney(summary?.extraExpenses), icon: Landmark, color: '#14b8a6' },
    { label: 'Per Member Utility', value: summaryLoading ? '...' : formatMoney(summary?.perExtraExpenses), icon: Coins, color: '#16a34a' },
    { label: 'Total Deposit', value: summaryLoading ? '...' : formatMoney(summary?.totalDepositAmount), icon: ClipboardList, color: '#22c55e' },
    { label: 'Due Amount', value: summaryLoading ? '...' : formatMoney(summary?.totalDue), icon: MessageSquareWarning, color: '#ef4444' },
    {
      label: 'Remaining Amount',
      value: summaryLoading ? '...' : formatMoney((summary?.totalDepositAmount ?? 0) - (summary?.totalDue ?? 0)),
      icon: Shield,
      color: '#fc782d',
    },
  ]

  if (isLoading || !user) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-[#58717d]">Loading...</div>
  }

  return (
    <MobileShell>
      <div className="bg-[#fc782d] px-4 pb-4 pt-4 text-white">
        <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
          <div className="h-10 w-10" />
          <div className="text-center">
            <div className="truncate text-[16px] font-extrabold leading-tight">{activeMess?.name ?? 'No mess selected'}</div>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white">
            <Bell size={18} />
          </button>
        </div>
      </div>

      <div className="screen">
        <section className="glass -mt-6 rounded-[28px] bg-white/96 px-4 pb-4 pt-4 shadow-[0_18px_45px_rgba(8,73,86,0.10)]">
          <div className="text-[15px] font-bold text-[#617784]">Good Morning, {greetingName} 👋</div>
          <div className="mt-1 text-[12px] text-[#6a7f8b]">Here&apos;s what&apos;s happening today</div>

          <div className="mt-4 grid grid-cols-3 gap-3 rounded-[22px] border border-[#e1eef1] bg-white p-3 shadow-[0_8px_20px_rgba(13,81,92,0.06)]">
            {[
              { label: 'Add Member', href: '/add-member', icon: Users, color: '#fc782d' },
              { label: 'Add Expense', href: '/add-expense', icon: CreditCard, color: '#22c55e' },
              { label: 'Add Meal', href: '/add-meal', icon: UtensilsCrossed, color: '#f59e0b' },
              { label: 'Add Deposit', href: '/deposits', icon: Coins, color: '#14b8a6' },
              { label: 'Send Notice', href: '/notices', icon: ClipboardList, color: '#3b82f6' },
              { label: 'Monthly Bill', href: '/monthly-bill', icon: Landmark, color: '#f97316' },
            ].map(({ label, href, icon: Icon, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => router.push(href)}
                className="flex flex-col items-center justify-center gap-2 rounded-[16px] px-1 py-2.5 text-center transition-transform active:scale-[0.97]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-[14px]" style={{ backgroundColor: `${color}15`, color }}>
                  <Icon size={19} />
                </div>
                <div className="text-[11px] font-bold leading-tight text-[#1d3950]">{label}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="section-title">Overview</div>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-[16px] border border-[#e1eef1] bg-white p-3.5 shadow-[0_8px_20px_rgba(13,81,92,0.06)]">
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ backgroundColor: `${card.color}12`, color: card.color }}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold leading-tight text-[#6a7f8b]">{card.label}</div>
                      <div className="mt-1 text-[15px] font-black leading-none text-[#1d3950]">{card.value}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-4 glass rounded-[28px] bg-white/96 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[14px] font-black uppercase tracking-[0.12em] text-[#58717d]">Monthly Overview</div>
              <div className="mt-1 text-[11px] text-[#6a7f8b]">{currentMonthLabel}</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-[#58717d]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                Income
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                Expense
              </span>
            </div>
          </div>

          <div className="mt-3">
            {chartLoading ? (
              <div className="flex h-[180px] items-center justify-center text-sm font-semibold text-[#6a7f8b]">Loading chart...</div>
            ) : (
              <MiniLineChart points={chartPoints} />
            )}
          </div>
        </section>
      </div>
    </MobileShell>
  )
}
