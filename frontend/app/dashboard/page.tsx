'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  CalendarDays,
  Check,
  CreditCard,
  ReceiptText,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react'

import { useAuth } from '@/app/context/auth-context'
import { DashboardHeader } from '@/components/dashboard-header'
import { MemberJoinRequestModal } from '@/components/member-join-request-modal'
import { MonthlyOverviewChart } from '@/components/dashboard/monthly-overview-chart'
import { LoadingSkeleton } from '@/components/dashboard/page-skeleton'
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table'
import { DashboardStatCard } from '@/components/dashboard/stat-card'
import {
  MobileQuickActions,
  type MobileQuickAction,
} from '@/components/dashboard/mobile-quick-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminDashboard,
  useDashboardActivity,
  useMessDashboard,
  useMesses,
  useMonthlyOverview,
  useMyMemberJoinRequests,
} from '@/hooks/use-dashboard-data'
import type { Mess } from '@/lib/api-client'
import {
  expenseCategoryLabel,
  useLocale,
  useLocaleFormatters,
  useTranslations,
  type MessageKey,
} from '@/lib/i18n'

type DashboardKey = MessageKey<'dashboard'>

function currentMonthValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function NoMessOnboarding({
  onCreate,
  onRequestAccess,
  requestPending,
  requestLoading,
}: {
  onCreate: () => void
  onRequestAccess: () => void
  requestPending: boolean
  requestLoading: boolean
}) {
  const t = useTranslations('dashboard')
  const benefits: DashboardKey[] = [
    'onboarding.benefitOne',
    'onboarding.benefitTwo',
    'onboarding.benefitThree',
  ]

  return (
    <Card className="mx-auto max-w-4xl shadow-none">
      <CardHeader className="border-b">
        <p className="text-sm font-medium text-primary">{t('onboarding.eyebrow')}</p>
        <CardTitle className="text-xl">{t('onboarding.title')}</CardTitle>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {t('onboarding.description')}
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          {benefits.map((benefitKey) => (
            <div key={benefitKey} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-3" />
              </span>
              <span className="text-muted-foreground">{t(benefitKey)}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
          <Button onClick={onCreate}>{t('onboarding.create')}</Button>
          <Button
            variant="outline"
            onClick={onRequestAccess}
            disabled={requestLoading || requestPending}
          >
            {requestLoading
              ? t('onboarding.checking')
              : requestPending
                ? t('onboarding.pending')
                : t('onboarding.request')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminRecentExpenses({
  expenses,
}: {
  expenses: Array<{
    id: string
    item_name?: string | null
    category: string
    amount: string | number
    expense_date: string
    mess?: { name: string }
  }>
}) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('dashboard')

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-base">{t('recentExpenses.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">{t('recentExpenses.expense')}</TableHead>
              <TableHead>{t('recentExpenses.mess')}</TableHead>
              <TableHead>{t('recentExpenses.date')}</TableHead>
              <TableHead className="pr-5 text-right">{t('recentExpenses.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!expenses.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                  {t('recentExpenses.empty')}
                </TableCell>
              </TableRow>
            ) : null}
            {expenses.slice(0, 5).map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="pl-5 font-medium">
                  {expense.item_name || expenseCategoryLabel(expense.category, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {expense.mess?.name || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format.date(expense.expense_date)}
                </TableCell>
                <TableCell className="pr-5 text-right font-medium tabular-nums">
                  {format.money(expense.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const format = useLocaleFormatters()
  const t = useTranslations('dashboard')
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)
  const [memberRequestOpen, setMemberRequestOpen] = useState(false)
  const [memberRequestSubmitted, setMemberRequestSubmitted] = useState(false)

  const { data: messesData, isLoading: messesLoading } = useMesses(
    user?.id,
    Boolean(user && user.role !== 'ADMIN'),
  )
  const {
    data: memberJoinRequestsData,
    isLoading: memberJoinRequestsLoading,
    mutate: refreshMemberJoinRequests,
  } = useMyMemberJoinRequests(user?.id, Boolean(user && user.role !== 'ADMIN'))
  const { data: adminDashboard } = useAdminDashboard(user?.role === 'ADMIN')

  const messes = useMemo(() => {
    const list = Array.isArray(messesData)
      ? messesData
      : messesData
        ? [messesData]
        : ((user?.memberships
            ?.filter((membership) => membership.is_active)
            .map((membership) => membership.mess)
            .filter(Boolean) ?? []) as Mess[])
    return list
  }, [messesData, user])

  const activeMess =
    messes.find((mess) => mess.is_active !== false) ??
    user?.memberships?.find((membership) => membership.is_active)?.mess
  const messId = activeMess?.id
  const managesMess = Boolean(
    user?.role === 'MANAGER' ||
      user?.memberships?.some(
        (membership) => membership.is_active && membership.role === 'MANAGER',
      ),
  )

  const { data: dashboard } = useMessDashboard(messId, selectedMonth)
  const { data: monthlyOverview, isLoading: chartLoading } = useMonthlyOverview(
    messId,
    selectedMonth,
  )
  const [year, month] = selectedMonth.split('-').map(Number)
  const { data: activity, isLoading: activityLoading } = useDashboardActivity(
    messId,
    year,
    month,
    managesMess,
  )

  const hasPendingMemberJoinRequest =
    memberRequestSubmitted ||
    (Array.isArray(memberJoinRequestsData) &&
      memberJoinRequestsData.some((request) => request.status === 'PENDING'))

  const stats = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return [
        { id: 'total-users', label: t('stats.totalUsers'), value: format.number(adminDashboard?.users ?? 0), description: t('stats.registeredAccounts') },
        { id: 'all-messes', label: t('stats.allMesses'), value: format.number(adminDashboard?.messes ?? 0), description: t('stats.managedWorkspaces') },
        { id: 'pending-requests', label: t('stats.pendingRequests'), value: format.number(adminDashboard?.pendingRequests ?? 0), description: t('stats.awaitingReview') },
        { id: 'pending-payments', label: t('stats.pendingPayments'), value: format.number(adminDashboard?.pendingPayments ?? 0), description: t('stats.awaitingApproval') },
      ]
    }

    return [
      {
        id: 'total-deposit',
        label: t('stats.totalDeposit'),
        value: format.money(
          Number(dashboard?.totalDepositAmount ?? 0) +
            Number(dashboard?.carryForwardRemainingAmount ?? 0),
        ),
        description: t('stats.includingCarry'),
        featured: true,
      },
      { id: 'total-meals', label: t('stats.totalMeals'), value: format.number(dashboard?.totalMeals ?? 0), description: t('stats.selectedMonth') },
      { id: 'meal-rate', label: t('stats.mealRate'), value: format.money(dashboard?.currentMealRate), description: t('stats.currentRate') },
      { id: 'food-expenses', label: t('stats.foodExpenses'), value: format.money(dashboard?.currentMonthTotalBazar), description: t('stats.selectedMonth') },
      { id: 'utility-expenses', label: t('stats.utilityExpenses'), value: format.money(dashboard?.extraExpenses), description: t('stats.selectedMonth') },
      {
        id: 'per-member-utility',
        label: t('stats.perMemberUtility'),
        value: format.money(dashboard?.perExtraExpenses),
        description: t('stats.currentShare'),
      },
      {
        id: 'due-amount',
        label: t('stats.dueAmount'),
        value: format.money(
          Number(dashboard?.totalDue ?? 0) +
            Number(dashboard?.carryForwardDueAmount ?? 0),
        ),
        description: t('stats.outstandingBalance'),
        destructive: Number(dashboard?.totalDue ?? 0) > 0,
      },
      {
        id: 'remaining-amount',
        label: t('stats.remainingAmount'),
        value: format.money(dashboard?.remainingAmount),
        description: t('stats.availableBalance'),
      },
    ]
  }, [adminDashboard, dashboard, format, t, user?.role])

  if (authLoading || !user) return <LoadingSkeleton />
  if (user.role !== 'ADMIN' && messesLoading) return <LoadingSkeleton />

  const showNoMessOnboarding = user.role !== 'ADMIN' && !activeMess
  const mobileQuickActions: MobileQuickAction[] = [
    { href: '/dashboard/meals', icon: UtensilsCrossed, label: t('quickActions.addMeal') },
    { href: '/dashboard/finance', icon: ShoppingBag, label: t('quickActions.addExpense') },
    { href: '/dashboard/payments', icon: CreditCard, label: t('quickActions.addDeposit') },
    { href: '/dashboard/meal-patterns', icon: CalendarClock, label: t('quickActions.mealPattern') },
    { href: '/dashboard/bazar-schedule', icon: CalendarDays, label: t('quickActions.bazarSchedule') },
    { href: '/dashboard/monthly-bills', icon: ReceiptText, label: t('quickActions.monthlyBill') },
  ]

  return (
    <div className="min-h-screen bg-background xl:flex xl:h-screen xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <DashboardHeader
        title={user.role === 'ADMIN' ? t('overview.adminTitle') : t('overview.title')}
        description={activeMess ? t('overview.messDescription', { name: activeMess.name }) : t('overview.welcome', { name: user.name })}
        selectedMonth={selectedMonth}
        onMonthChange={user.role === 'ADMIN' ? undefined : setSelectedMonth}
        showQuickAddButton={Boolean(activeMess)}
      />

      <div className="space-y-4 p-4 sm:p-5 lg:p-6 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        {showNoMessOnboarding ? (
          <NoMessOnboarding
            onCreate={() => router.push('/dashboard/mess_management')}
            onRequestAccess={() => setMemberRequestOpen(true)}
            requestPending={hasPendingMemberJoinRequest}
            requestLoading={memberJoinRequestsLoading}
          />
        ) : (
          <>
            {user.role !== 'ADMIN' && activeMess ? (
              <MobileQuickActions
                actions={mobileQuickActions}
                title={t('quickActions.title')}
              />
            ) : null}

            <div className="flex items-center justify-between gap-3 sm:hidden">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
                {t('overview.mobileTitle')}
              </h2>
              {user.role !== 'ADMIN' ? (
                <EnterpriseMonthPicker
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  shortLabel
                  className="h-9 w-[8.75rem] shrink-0 rounded-lg px-2.5 text-xs"
                  ariaLabel={t('overview.selectMonth')}
                />
              ) : null}
            </div>

            <section aria-label={t('overview.statisticsLabel')} className="grid shrink-0 grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
              {stats.map(({ id, ...stat }) => (
                <DashboardStatCard key={id} {...stat} />
              ))}
            </section>

            {user.role === 'ADMIN' ? (
              <AdminRecentExpenses expenses={adminDashboard?.recentExpenses ?? []} />
            ) : (
              <section className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(28rem,.9fr)]">
                <Card className="gap-0 overflow-hidden py-0 shadow-none xl:flex xl:min-h-0 xl:flex-col">
                  <CardHeader className="shrink-0 border-b px-4 py-3">
                    <div>
                      <CardTitle className="text-base">{t('overview.monthlyTitle')}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('overview.monthlyDescription')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 px-3 py-2 sm:px-4">
                    <MonthlyOverviewChart
                      data={monthlyOverview ?? []}
                      isLoading={chartLoading ?? false}
                    />
                  </CardContent>
                </Card>

                <RecentActivityTable activity={activity} isLoading={activityLoading} />
              </section>
            )}
          </>
        )}
      </div>

      <MemberJoinRequestModal
        open={memberRequestOpen}
        onClose={() => setMemberRequestOpen(false)}
        hasPendingRequest={hasPendingMemberJoinRequest}
        onSubmitted={() => {
          setMemberRequestSubmitted(true)
          void refreshMemberJoinRequests()
        }}
      />
    </div>
  )
}
