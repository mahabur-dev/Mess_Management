'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  CalendarDays,
  ChevronDown,
  ChevronRight,
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
import { HomeCard, HomeEmptyState, HomeMetricCard, HomeQuickAction } from '@/components/home-card'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { ExpenseListItem, type ExpenseListRecord } from '@/components/mobile/expense-design'
import { currentMonthValue, formatMonthLabel } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { useActiveMess } from '@/hooks/use-active-mess'
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
  remainingAmount?: number
  netBalance?: number
  totalDepositAmount?: number
  paidAmount?: number
  activeMembers?: number
  pendingPayments?: number
  openComplaints?: number
  totalRoomRent?: number
  totalCost?: number
  billingStatus?: 'DIRTY' | 'PROCESSING' | 'READY' | 'FAILED'
  billingCalculatedAt?: string | null
  billingDataFresh?: boolean
  notices?: DashboardNotice[]
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '--'
  return `${String.fromCodePoint(0x09f3)} ${Number(value).toLocaleString('en-US')}`
}

function HomeMonthPill({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  return (
    <label className="home-month-pill">
      <CalendarDays size={15} strokeWidth={2.35} aria-hidden="true" />
      <span>{formatMonthLabel(month)}</span>
      <ChevronDown size={15} strokeWidth={2.35} aria-hidden="true" />
      <input
        aria-label="Select overview month"
        type="month"
        value={month}
        onChange={(event) => {
          if (/^\d{4}-\d{2}$/.test(event.target.value)) onChange(event.target.value)
        }}
      />
    </label>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [month, setMonth] = useState(currentMonthValue())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<ExpenseListRecord[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [expensesLoading, setExpensesLoading] = useState(false)
  const { activeMess, isLoading: activeMessLoading, retry: retryActiveMess, status: activeMessStatus } = useActiveMess(user)

  const profileName = user?.name || 'Manager'
  const hasWorkspace = activeMessStatus === 'connected'
  const showOnboarding = activeMessStatus === 'disconnected'
  const quickActions = hasWorkspace ? getHomeQuickActions(user) : []

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (!activeMess?.id) {
      setSummary(null)
      setRecentExpenses([])
      return
    }

    let cancelled = false
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    setSummaryLoading(true)

    const loadSummary = (initialLoad: boolean) => {
      api
        .getMessDashboard(activeMess.id, `${month}-01`)
        .then((res) => {
          if (cancelled) return
          const nextSummary = res.data as DashboardSummary
          setSummary(nextSummary)
          if (
            nextSummary.billingDataFresh === false &&
            nextSummary.billingStatus !== 'FAILED'
          ) {
            refreshTimer = setTimeout(() => loadSummary(false), 1500)
          }
        })
        .catch(() => {
          if (!cancelled && initialLoad) setSummary(null)
        })
        .finally(() => {
          if (!cancelled && initialLoad) setSummaryLoading(false)
        })
    }

    loadSummary(true)

    return () => {
      cancelled = true
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [activeMess?.id, month])

  useEffect(() => {
    if (!activeMess?.id) {
      setRecentExpenses([])
      return
    }

    let cancelled = false
    setExpensesLoading(true)
    api
      .getExpensesByMess(activeMess.id, { billingMonth: `${month}-01`, approvalStatus: 'APPROVED', limit: 3, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((res: any) => {
        if (!cancelled) setRecentExpenses(Array.isArray(res.data) ? res.data.slice(0, 3) : [])
      })
      .catch(() => {
        if (!cancelled) setRecentExpenses([])
      })
      .finally(() => {
        if (!cancelled) setExpensesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeMess?.id, month])

  const cards = [
    { label: 'Total Member', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading total members" /> : summary?.activeMembers ?? '--', icon: Users, color: '#008d8c' },
    { label: 'Today Meal', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading today meals" /> : summary?.todayTotalMeals ?? '--', icon: UtensilsCrossed, color: '#4bbfc0' },
    { label: 'Total Meals', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading total meals" /> : summary?.totalMeals ?? '--', icon: ReceiptText, color: '#0aa0a0' },
    {
      label: 'Meal Rate',
      value: summaryLoading ? <LoadingIndicator size="sm" label="Loading meal rate" /> : summary?.currentMealRate != null ? `${String.fromCodePoint(0x09f3)} ${summary.currentMealRate}` : '--',
      icon: Wallet2,
      color: '#008d8c',
    },
    { label: 'Food Expenses', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading food expenses" /> : formatMoney(summary?.currentMonthTotalBazar), icon: CreditCard, color: '#00777a' },
    { label: 'Utility Expenses', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading utility expenses" /> : formatMoney(summary?.extraExpenses), icon: Landmark, color: '#0aa0a0' },
    { label: 'Per Member Utility', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading member utility" /> : formatMoney(summary?.perExtraExpenses), icon: Coins, color: '#0aa0a0' },
    { label: 'Total Deposit', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading total deposit" /> : formatMoney(summary?.totalDepositAmount), icon: ClipboardList, color: '#4bbfc0' },
    { label: 'Due Amount', value: summaryLoading ? <LoadingIndicator size="sm" label="Loading due amount" /> : formatMoney(summary?.totalDue), icon: MessageSquareWarning, color: '#00777a' },
    {
      label: 'Remaining Amount',
      value: summaryLoading ? <LoadingIndicator size="sm" label="Loading remaining amount" /> : formatMoney(summary?.remainingAmount),
      icon: Shield,
      color: '#008d8c',
    },
  ]

  if (isLoading || !user) {
    return <LoadingIndicator variant="screen" label="Loading home" />
  }

  return (
    <MobileShell
      showBottomNavigation
      appearance={showOnboarding ? 'onboarding' : 'default'}
    >
      <AppHeader
        title={profileName}
        subtitle="Here's what's happening today"
        hasUnreadNotices={Boolean(summary?.notices?.length)}
        variant={showOnboarding ? 'onboarding' : 'default'}
      />

      <div className={`screen ${showOnboarding ? 'no-mess-home' : 'home-screen'}`}>
        {activeMessLoading ? (
          <HomeCard as="div" role="status" className="home-status-card">Checking mess workspace...</HomeCard>
        ) : activeMessStatus === 'error' ? (
          <HomeCard as="div" role="alert" className="home-status-card">
            <p className="text-label font-bold text-[#65838b]">Unable to check your mess workspace.</p>
            <button
              type="button"
              onClick={retryActiveMess}
              className="home-card-action mt-3 bg-[#008d8c] text-white"
            >
              Try Again
            </button>
          </HomeCard>
        ) : hasWorkspace ? (
          <HomeCard ariaLabel="Quick actions" className="home-quick-actions-card">
            <div className="grid grid-cols-3 gap-1.5">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <HomeQuickAction
                  key={label}
                  label={label}
                  icon={Icon}
                  onClick={() => router.push(appHref(href))}
                />
              ))}
            </div>
          </HomeCard>
        ) : showOnboarding ? (
          <MessOnboardingActions />
        ) : null}

        {hasWorkspace ? (
          <>
            <HomeCard
              title="Overview"
              className="mt-3.5"
              action={<HomeMonthPill month={month} onChange={setMonth} />}
            >
              <div className="grid grid-cols-2 gap-2">
                {cards.map((card) => (
                  <HomeMetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} accent={card.color} />
                ))}
              </div>
            </HomeCard>

            <HomeCard
              title="Recent Expenses"
              caption={`Latest 3 entries in ${formatMonthLabel(month)}`}
              className="mt-3.5"
              action={
                <button
                  type="button"
                  onClick={() => router.push(appHref('/expenses'))}
                  className="home-card-action"
                >
                  View All
                  <ChevronRight size={14} strokeWidth={2.7} />
                </button>
              }
            >

              <div className="flush-list flush-list--home-card">
                {expensesLoading ? (
                  <LoadingIndicator variant="card" label="Loading expenses" className="mx-3 !w-auto" />
                ) : null}
                {!expensesLoading &&
                  recentExpenses.map((item) => (
                    <ExpenseListItem
                      key={item.id}
                      item={item}
                      href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(activeMess?.id ?? '')}`}
                      variant="horizontal"
                    />
                  ))}
                {!expensesLoading && !recentExpenses.length ? (
                  <HomeEmptyState>No recent expenses found.</HomeEmptyState>
                ) : null}
              </div>
            </HomeCard>
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}
