'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Landmark,
  MessageSquareWarning,
  ReceiptText,
  Shield,
  Users,
  UtensilsCrossed,
  Wallet2,
  Coins,
  Bot,
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { HomeCard, HomeEmptyState, HomeMetricCard, HomeQuickAction } from '@/components/home-card'
import { LoadingIndicator } from '@/components/loading-indicator'
import { BillingCalculationNotice } from '@/components/mobile/billing-status-notice'
import { MonthPicker } from '@/components/mobile/date-picker'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { ExpenseListItem, type ExpenseListRecord } from '@/components/mobile/expense-design'
import { currentMonthValue } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { useActiveMess } from '@/hooks/use-active-mess'
import { api } from '@/lib/api'
import { canManageMess, getHomeQuickActions } from '@/lib/app-permissions'
import { appHref } from '@/lib/routes'
import { useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { routeLabel } from '@/lib/i18n/navigation'
import { useAuth } from './providers'

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
}

function HomeMonthPill({
  month,
  onChange,
  label,
  monthLabel,
}: {
  month: string
  onChange: (month: string) => void
  label: string
  monthLabel: string
}) {
  return (
    <MonthPicker
      label={label}
      value={month}
      onChange={onChange}
      renderTrigger={({ open, selectedLabel, buttonProps }) => (
        <button {...buttonProps} className="home-month-pill">
          <CalendarDays size={15} strokeWidth={2.35} aria-hidden="true" />
          <span>{selectedLabel || monthLabel}</span>
          <ChevronDown size={15} strokeWidth={2.35} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
    />
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const common = useTranslations('common')
  const navigation = useTranslations('navigation')
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const [month, setMonth] = useState(currentMonthValue())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<ExpenseListRecord[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(false)
  const [expensesError, setExpensesError] = useState(false)
  const [summaryRetryToken, setSummaryRetryToken] = useState(0)
  const [expensesRetryToken, setExpensesRetryToken] = useState(0)
  const { activeMess, isLoading: activeMessLoading, retry: retryActiveMess, status: activeMessStatus } = useActiveMess(user)

  const profileName = user?.name || common(canManageMess(user) ? 'managerFallback' : 'memberFallback')
  const hasWorkspace = activeMessStatus === 'connected'
  const showOnboarding = activeMessStatus === 'disconnected'
  const quickActions = hasWorkspace ? getHomeQuickActions(user) : []
  const monthLabel = format.month(`${month}-01`)
  const money = (value?: number | null) => value == null || Number.isNaN(Number(value)) ? '--' : format.money(value)
  const number = (value?: number | null) => value == null || Number.isNaN(Number(value)) ? '--' : format.number(value)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (!activeMess?.id) {
      setSummary(null)
      setRecentExpenses([])
      setSummaryError(false)
      return
    }

    let cancelled = false
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    setSummaryLoading(true)
    setSummaryError(false)

    const loadSummary = (initialLoad: boolean) => {
      api
        .getMessDashboard(activeMess.id, `${month}-01`)
        .then((res) => {
          if (cancelled) return
          const nextSummary = res.data as DashboardSummary
          setSummary(nextSummary)
          setSummaryError(false)
          if (
            nextSummary.billingDataFresh === false &&
            nextSummary.billingStatus !== 'FAILED'
          ) {
            refreshTimer = setTimeout(() => loadSummary(false), 1500)
          }
        })
        .catch(() => {
          if (!cancelled && initialLoad) {
            setSummary(null)
            setSummaryError(true)
          }
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
  }, [activeMess?.id, month, summaryRetryToken])

  useEffect(() => {
    if (!activeMess?.id) {
      setRecentExpenses([])
      setExpensesError(false)
      return
    }

    let cancelled = false
    setExpensesLoading(true)
    setExpensesError(false)
    api
      .getExpensesByMess(activeMess.id, { billingMonth: `${month}-01`, approvalStatus: 'APPROVED', limit: 3, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((res: any) => {
        if (!cancelled) {
          setRecentExpenses(Array.isArray(res.data) ? res.data.slice(0, 3) : [])
          setExpensesError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecentExpenses([])
          setExpensesError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setExpensesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeMess?.id, expensesRetryToken, month])

  const cards = [
    { label: common('totalMember'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('totalMember') })} /> : number(summary?.activeMembers), icon: Users, color: '#008d8c' },
    { label: common('todayMeal'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('todayMeal') })} /> : number(summary?.todayTotalMeals), icon: UtensilsCrossed, color: '#4bbfc0' },
    { label: common('totalMeals'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('totalMeals') })} /> : number(summary?.totalMeals), icon: ReceiptText, color: '#0aa0a0' },
    {
      label: common('mealRate'),
      value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('mealRate') })} /> : money(summary?.currentMealRate),
      icon: Wallet2,
      color: '#008d8c',
    },
    { label: common('foodExpenses'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('foodExpenses') })} /> : money(summary?.currentMonthTotalBazar), icon: CreditCard, color: '#00777a' },
    { label: common('utilityExpenses'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('utilityExpenses') })} /> : money(summary?.extraExpenses), icon: Landmark, color: '#0aa0a0' },
    { label: common('perMemberUtility'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('perMemberUtility') })} /> : money(summary?.perExtraExpenses), icon: Coins, color: '#0aa0a0' },
    { label: common('totalDeposit'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('totalDeposit') })} /> : money(summary?.totalDepositAmount), icon: ClipboardList, color: '#4bbfc0' },
    { label: common('dueAmount'), value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('dueAmount') })} /> : money(summary?.totalDue), icon: MessageSquareWarning, color: '#00777a' },
    {
      label: common('remainingAmount'),
      value: summaryLoading ? <LoadingIndicator size="sm" label={common('loadingMetric', { metric: common('remainingAmount') })} /> : money(summary?.remainingAmount),
      icon: Shield,
      color: '#008d8c',
    },
  ]

  if (isLoading || !user) {
    return <LoadingIndicator variant="screen" label={common('loadingApplication')} />
  }

  return (
    <MobileShell
      showBottomNavigation
      appearance={showOnboarding ? 'onboarding' : 'default'}
    >
      <AppHeader
        title={profileName}
        subtitle={common('homeGreeting')}
        variant={showOnboarding ? 'onboarding' : 'default'}
      />

      <div className={`screen ${showOnboarding ? 'no-mess-home' : 'home-screen'}`}>
        {activeMessLoading ? (
          <HomeCard as="div" role="status" className="home-status-card">{common('checkingWorkspace')}</HomeCard>
        ) : activeMessStatus === 'error' ? (
          <HomeCard as="div" role="alert" className="home-status-card">
            <p className="text-label font-semibold text-[#65838b]">{common('workspaceCheckFailed')}</p>
            <button
              type="button"
              onClick={retryActiveMess}
              className="home-card-action mt-3 bg-[#008d8c] text-white"
            >
              {common('retry')}
            </button>
          </HomeCard>
        ) : hasWorkspace ? (
          <HomeCard ariaLabel={common('quickActions')} className="home-quick-actions-card">
            <div className="grid grid-cols-3 gap-1.5">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <HomeQuickAction
                  key={label}
                  label={routeLabel(href, label, navigation)}
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
            <button
              type="button"
            onClick={() => router.push(appHref('/quick-add'))}
            className="home-ai-entry"
            aria-label={common('openQuickAddAi')}
          >
              <span className="home-ai-entry__icon" aria-hidden="true">
                <Bot size={21} strokeWidth={2.15} />
              </span>
              <span className="home-ai-entry__copy">
                <span className="home-ai-entry__assistant">{common('aiAssistant')}</span>
                <span className="home-ai-entry__title">{common('quickAddAi')}</span>
              </span>
            </button>

            <HomeCard
              title={common('overview')}
              className="mt-3.5"
              action={<HomeMonthPill month={month} onChange={setMonth} label={common('selectOverviewMonth')} monthLabel={monthLabel} />}
            >
              {summaryError ? (
                <HomeEmptyState>
                  <span>{common('loadHomeOverviewFailed')}</span>
                  <button type="button" className="home-card-action mt-2" onClick={() => setSummaryRetryToken((current) => current + 1)}>
                    {common('retry')}
                  </button>
                </HomeEmptyState>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {cards.map((card) => (
                    <HomeMetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} accent={card.color} />
                  ))}
                </div>
              )}
            </HomeCard>

            {!summaryLoading && !summaryError ? <BillingCalculationNotice status={summary?.billingStatus} /> : null}

            <HomeCard
              title={common('recentExpenses')}
              caption={common('latestEntries', { month: monthLabel })}
              className="mt-3.5"
              action={
                <button
                  type="button"
                  onClick={() => router.push(appHref('/expenses'))}
                  className="home-card-action"
                >
                  {common('viewAll')}
                </button>
              }
            >

              <div className="flush-list flush-list--home-card">
                {expensesLoading ? (
                  <LoadingIndicator variant="card" label={common('loadingExpenses')} className="mx-3 !w-auto" />
                ) : null}
                {!expensesLoading && expensesError ? (
                  <HomeEmptyState>
                    <span>{common('loadRecentExpensesFailed')}</span>
                    <button type="button" className="home-card-action mt-2" onClick={() => setExpensesRetryToken((current) => current + 1)}>
                      {common('retry')}
                    </button>
                  </HomeEmptyState>
                ) : null}
                {!expensesLoading && !expensesError &&
                  recentExpenses.map((item) => (
                    <ExpenseListItem
                      key={item.id}
                      item={item}
                      href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(activeMess?.id ?? '')}`}
                      variant="horizontal"
                      showChevron={false}
                    />
                  ))}
                {!expensesLoading && !expensesError && !recentExpenses.length ? (
                  <HomeEmptyState>{common('noRecentExpenses')}</HomeEmptyState>
                ) : null}
              </div>
            </HomeCard>

          </>
        ) : null}
      </div>
    </MobileShell>
  )
}
