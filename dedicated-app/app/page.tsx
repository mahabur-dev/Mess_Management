'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
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
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { ExpenseListItem, type ExpenseListRecord } from '@/components/mobile/expense-design'
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

function formatMoney(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '--'
  return `${String.fromCodePoint(0x09f3)} ${Number(value).toLocaleString('en-US')}`
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<ExpenseListRecord[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [activeMess, setActiveMess] = useState<MessSummary | null>(null)
  const [activeMessLoading, setActiveMessLoading] = useState(false)

  const profileName = user?.name || 'Manager'
  const hasWorkspace = Boolean(activeMess?.id)
  const quickActions = hasWorkspace ? getHomeQuickActions(user) : []

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (!user) return

    const membershipMess = user.memberships?.find((membership) => membership.mess)?.mess ?? null
    if (membershipMess) {
      setActiveMess(membershipMess)
      setActiveMessLoading(false)
      return
    }

    let cancelled = false
    setActiveMessLoading(true)
    api
      .getMesses()
      .then((res) => {
        const firstMess = Array.isArray(res.data) ? (res.data[0] as MessSummary | undefined) : undefined
        if (!cancelled) setActiveMess(firstMess ?? null)
      })
      .catch(() => {
        if (!cancelled) setActiveMess(null)
      })
      .finally(() => {
        if (!cancelled) setActiveMessLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!activeMess?.id) {
      setSummary(null)
      setRecentExpenses([])
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
    if (!activeMess?.id) {
      setRecentExpenses([])
      return
    }

    let cancelled = false
    setExpensesLoading(true)
    api
      .getExpensesByMess(activeMess.id, { limit: 3, sortBy: 'expense_date', sortOrder: 'desc' })
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
    <MobileShell
      showBottomNavigation
      appearance={!hasWorkspace && !activeMessLoading ? 'onboarding' : 'default'}
    >
      <AppHeader
        title={profileName}
        subtitle="Here's what's happening today"
        hasUnreadNotices={Boolean(summary?.notices?.length)}
        variant={!hasWorkspace && !activeMessLoading ? 'onboarding' : 'default'}
      />

      <div className={`screen ${hasWorkspace || activeMessLoading ? 'home-screen' : 'no-mess-home'}`}>
        {activeMessLoading ? (
          <div className="quick-actions-card px-4 py-5 text-center text-label font-bold text-[#65838b]">Checking mess workspace...</div>
        ) : hasWorkspace ? (
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
        ) : (
          <MessOnboardingActions />
        )}

        {hasWorkspace ? (
          <>
            <section className="home-panel mt-3.5">
              <div className="section-title">Overview</div>
              <div className="grid grid-cols-2 gap-2">
                {cards.map((card) => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className="overview-card">
                      <div className="flex items-start gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]" style={{ backgroundColor: `${card.color}12`, color: card.color }}>
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

            <section className="home-panel mt-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="section-title mb-0">Recent Expenses</div>
                  <div className="mt-1 text-caption font-semibold text-[#65838b]">Latest 3 entries</div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(appHref('/expenses'))}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[12px] bg-[#edfafa] px-3 text-caption font-bold text-[#008d8c] transition active:scale-[0.98]"
                >
                  View All
                  <ChevronRight size={14} strokeWidth={2.7} />
                </button>
              </div>

              <div className="flush-list flush-list--home-panel mt-3">
                {expensesLoading ? (
                  <div className="mx-2.5 rounded-[18px] bg-[#edfafa] px-4 py-5 text-center text-label font-bold text-[#65838b]">Loading expenses...</div>
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
                  <div className="mx-2.5 rounded-[18px] bg-[#edfafa] px-4 py-5 text-center text-label font-bold text-[#65838b]">No recent expenses found.</div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}
