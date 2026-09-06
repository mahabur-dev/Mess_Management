'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

import { useAuth } from '@/app/context/auth-context'
import { DashboardHeader } from '@/components/dashboard-header'
import { MemberJoinRequestModal } from '@/components/member-join-request-modal'
import { MonthlyOverviewChart } from '@/components/dashboard/monthly-overview-chart'
import { LoadingSkeleton } from '@/components/dashboard/page-skeleton'
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table'
import { DashboardStatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function currentMonthValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date)
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
  const benefits = [
    'Manage meals, deposits, expenses, and monthly bills in one place.',
    'Give every member the right access based on their role.',
    'Keep records organized and ready whenever you need them.',
  ]

  return (
    <Card className="mx-auto max-w-4xl shadow-none">
      <CardHeader className="border-b">
        <p className="text-sm font-medium text-primary">Workspace setup</p>
        <CardTitle className="text-xl">Connect your account to a mess</CardTitle>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Create a new mess or request access from an active mess manager before
          using the dashboard.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-3" />
              </span>
              <span className="text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
          <Button onClick={onCreate}>Create mess</Button>
          <Button
            variant="outline"
            onClick={onRequestAccess}
            disabled={requestLoading || requestPending}
          >
            {requestLoading
              ? 'Checking request'
              : requestPending
                ? 'Request pending'
                : 'Request access'}
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
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-base">Recent expense receipts</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Expense</TableHead>
              <TableHead>Mess</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="pr-5 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!expenses.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                  No recent expense receipts.
                </TableCell>
              </TableRow>
            ) : null}
            {expenses.slice(0, 5).map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="pl-5 font-medium">
                  {expense.item_name || expense.category}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {expense.mess?.name || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(expense.expense_date)}
                </TableCell>
                <TableCell className="pr-5 text-right font-medium tabular-nums">
                  {money(expense.amount)}
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
        { label: 'Total users', value: adminDashboard?.users ?? 0, description: 'Registered accounts' },
        { label: 'All messes', value: adminDashboard?.messes ?? 0, description: 'Managed workspaces' },
        { label: 'Pending requests', value: adminDashboard?.pendingRequests ?? 0, description: 'Awaiting review' },
        { label: 'Pending payments', value: adminDashboard?.pendingPayments ?? 0, description: 'Awaiting approval' },
      ]
    }

    return [
      {
        label: 'Total deposit',
        value: money(
          Number(dashboard?.totalDepositAmount ?? 0) +
            Number(dashboard?.carryForwardRemainingAmount ?? 0),
        ),
        description: 'Including carry forward',
        featured: true,
      },
      { label: 'Total meals', value: dashboard?.totalMeals ?? 0, description: 'Selected month' },
      { label: 'Meal rate', value: money(dashboard?.currentMealRate), description: 'Current rate' },
      { label: 'Food expenses', value: money(dashboard?.currentMonthTotalBazar), description: 'Selected month' },
      { label: 'Utility expenses', value: money(dashboard?.extraExpenses), description: 'Selected month' },
      {
        label: 'Per member utility',
        value: money(dashboard?.perExtraExpenses),
        description: 'Current share',
      },
      {
        label: 'Due amount',
        value: money(
          Number(dashboard?.totalDue ?? 0) +
            Number(dashboard?.carryForwardDueAmount ?? 0),
        ),
        description: 'Outstanding balance',
        destructive: Number(dashboard?.totalDue ?? 0) > 0,
      },
      {
        label: 'Remaining amount',
        value: money(dashboard?.remainingAmount),
        description: 'Available balance',
      },
    ]
  }, [adminDashboard, dashboard, user?.role])

  if (authLoading || !user) return <LoadingSkeleton />
  if (user.role !== 'ADMIN' && messesLoading) return <LoadingSkeleton />

  const showNoMessOnboarding = user.role !== 'ADMIN' && !activeMess

  return (
    <div className="min-h-screen bg-background xl:flex xl:h-screen xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <DashboardHeader
        title={user.role === 'ADMIN' ? 'Super Admin Dashboard' : 'Dashboard'}
        description={activeMess ? `${activeMess.name} overview` : `Welcome back, ${user.name}`}
        selectedMonth={selectedMonth}
        onMonthChange={user.role === 'ADMIN' ? undefined : setSelectedMonth}
        showQuickAddButton={Boolean(activeMess)}
      />

      <main className="space-y-4 p-4 sm:p-5 lg:p-6 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        {showNoMessOnboarding ? (
          <NoMessOnboarding
            onCreate={() => router.push('/dashboard/mess_management')}
            onRequestAccess={() => setMemberRequestOpen(true)}
            requestPending={hasPendingMemberJoinRequest}
            requestLoading={memberJoinRequestsLoading}
          />
        ) : (
          <>
            <section aria-label="Dashboard statistics" className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <DashboardStatCard key={stat.label} {...stat} />
              ))}
            </section>

            {user.role === 'ADMIN' ? (
              <AdminRecentExpenses expenses={adminDashboard?.recentExpenses ?? []} />
            ) : (
              <section className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(28rem,.9fr)]">
                <Card className="gap-0 overflow-hidden py-0 shadow-none xl:flex xl:min-h-0 xl:flex-col">
                  <CardHeader className="shrink-0 border-b px-4 py-3">
                    <div>
                      <CardTitle className="text-base">Monthly overview</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Bazar, deposits, and meals for the selected month
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
      </main>

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
