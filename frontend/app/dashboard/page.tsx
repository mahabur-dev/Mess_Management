'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'
import {
  apiClient,
  type AdminDashboard,
  type Mess,
  type MessDashboard,
} from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  BadgeDollarSign,
  Bell,
  Calculator,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  HandCoins,
  Home,
  ReceiptText,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  WalletCards,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ElementType } from 'react'

const quickActions = [
  ['Add Member', Users, '/dashboard/member_management'],
  ['Add Expense', WalletCards, '/dashboard/finance'],
  ['Add Meal Plan', UtensilsCrossed, '/dashboard/meals'],
  ['Send Notice', Bell, '/dashboard/notices'],
] as const

const adminQuickActions = [
  ['Manage Users', Users, '/dashboard/users'],
  ['Mess Requests', ClipboardList, '/dashboard/mess_requests'],
  ['All Messes', Home, '/dashboard/mess_management'],
  ['Complaints', Bell, '/dashboard/complaints'],
  ['Payments', CreditCard, '/dashboard/payments'],
  ['Reports', ReceiptText, '/dashboard/reports'],
] as const

function currentMonthValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

// ─── Chart Skeleton ──────────────────────────────────────────
function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-[#e6ebf4]" />
      <div
        className="w-full rounded-xl bg-[#f1f5f9]"
        style={{ height }}
      />
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  badge: string
  icon: ElementType
  accent: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className={`group relative min-h-[92px] overflow-hidden rounded-xl bg-gradient-to-r ${accent} p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]`}>
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl transition group-hover:bg-white/25" />
      <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-white/8 blur-xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-white/80">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black leading-none tracking-tight text-white">
            {value}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-white/60">
            <ArrowUpRight size={11} />
            <span>Live update</span>
          </div>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
          <Icon size={20} strokeWidth={2.4} />
        </span>
      </div>
    </div>
  )
}

// ─── MiniStatCard ─────────────────────────────────────────────
function MiniStatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  icon: ElementType
  tone: string
}) {
  return (
    <div className={`group relative min-h-[92px] overflow-hidden rounded-xl bg-gradient-to-r ${tone} p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]`}>
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-white/80">{label}</p>
          <p className="mt-2 text-2xl font-black leading-none">{value}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-white/60">
            <ArrowUpRight size={11} />
            <span>Live update</span>
          </div>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
          <Icon size={19} />
        </div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[#e6ebf4] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(65,103,153,0.12)]">
      <p className="mb-2 text-xs font-bold text-[#6b7a99]">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm font-bold text-[#172554]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
          <span>{entry.name}: {entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [messes, setMesses] = useState<Mess[]>([])
  const [messDashboard, setMessDashboard] = useState<MessDashboard | null>(null)
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null)
  const [messSubscription, setMessSubscription] = useState<{ plan?: string; status?: string; end_date?: string | null } | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)

  // Chart states
  const [monthlyOverview, setMonthlyOverview] = useState<Array<{ day: string; income: number; expense: number }>>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<Array<{ name: string; value: number; amount: number; color: string }>>([])
  const [weeklyMeals, setWeeklyMeals] = useState<Array<{ day: string; breakfast: number; lunch: number; dinner: number }>>([])
  const [chartLoading, setChartLoading] = useState(true)

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const dashboardQuickActions = user?.role === 'ADMIN' ? adminQuickActions : quickActions

  // ── Load dashboard data ──────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function load() {
      if (!user) return

      setLoadingData(true)

      try {
        if (user.role === 'ADMIN') {
          const admin = await apiClient.getAdminDashboard()
          if (mounted) setAdminDashboard(admin.data)
        }

        const messResponse = await apiClient.getMesses().catch(() => null)

        const list = Array.isArray(messResponse?.data)
          ? messResponse.data
          : messResponse?.data
            ? [messResponse.data]
            : ((user.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])

        if (mounted) setMesses(list)

        if (list[0]) {
          const dashboard = await apiClient.getMessDashboard(list[0].id, `${selectedMonth}-01`).catch(() => null)
          if (mounted && dashboard) setMessDashboard(dashboard.data)

          const subscription = await apiClient.getMessSubscription(list[0].id).catch(() => null)
          if (mounted && subscription?.data) {
            setMessSubscription(subscription.data as { plan?: string; status?: string; end_date?: string | null })
          } else if (mounted) {
            setMessSubscription(null)
          }
        }
        if (!list[0]) setMessSubscription(null)
      } finally {
        if (mounted) setLoadingData(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [selectedMonth, user])

  // ── Load chart data ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function loadCharts() {
      const messId = messes[0]?.id || user?.memberships?.[0]?.mess?.id
      if (!messId || user?.role === 'ADMIN') {
        if (mounted) setChartLoading(false)
        return
      }

      setChartLoading(true)

      try {
        const [overviewRes, breakdownRes, mealsRes] = await Promise.all([
          apiClient.getMonthlyOverview(messId, `${selectedMonth}-01`),
          apiClient.getExpenseBreakdown(messId, `${selectedMonth}-01`),
          apiClient.getWeeklyMealCount(messId),
        ])

        if (mounted) {
          setMonthlyOverview(overviewRes.data || [])
          setExpenseBreakdown(breakdownRes.data?.data || [])
          setWeeklyMeals(mealsRes.data || [])
        }
      } catch {
        // Keep empty arrays on error
        if (mounted) {
          setMonthlyOverview([])
          setExpenseBreakdown([])
          setWeeklyMeals([])
        }
      } finally {
        if (mounted) setChartLoading(false)
      }
    }

    loadCharts()

    return () => {
      mounted = false
    }
  }, [selectedMonth, messes, user])

  const stats = useMemo(() => {
    const dashboard = messDashboard as
      | (MessDashboard & {
        totalMeals?: number
        extraExpenses?: number
        perExtraExpenses?: number
        perMemberExtraCharge?: number
      })
      | null

    if (user?.role === 'ADMIN') {
      return [
        [
          'Total Users',
          adminDashboard?.users ?? 0,
          'Users',
          Users,
          'from-[#2f80ed] to-[#6f3df4]',
          'bg-[#e8f2ff]',
          'text-[#2f80ed]',
        ],
        [
          'All Messes',
          adminDashboard?.messes ?? 0,
          'Messes',
          Home,
          'from-[#10b981] to-[#34d399]',
          'bg-[#e8fff2]',
          'text-[#22b66f]',
        ],
        [
          'Pending Requests',
          adminDashboard?.pendingRequests ?? 0,
          'Requests',
          ClipboardList,
          'from-[#f59e0b] to-[#f97316]',
          'bg-[#fff3df]',
          'text-[#f59e0b]',
        ],
        [
          'Pending Payments',
          adminDashboard?.pendingPayments ?? 0,
          'Payments',
          CreditCard,
          'from-[#f43f7f] to-[#ef4444]',
          'bg-[#ffe8f0]',
          'text-[#f43f7f]',
        ],
      ] as const
    }

    return [
      [
        'Total Members',
        dashboard?.activeMembers ?? 0,
        'Members',
        Users,
        'from-[#2f80ed] to-[#6f3df4]',
        'bg-[#e8f2ff]',
        'text-[#2f80ed]',
      ],
      [
        'Meals Today',
        dashboard?.todayTotalMeals ?? 0,
        'Today',
        UtensilsCrossed,
        'from-[#10b981] to-[#34d399]',
        'bg-[#e8fff2]',
        'text-[#22b66f]',
      ],
      [
        'Total Meals',
        dashboard?.totalMeals ?? 0,
        'Monthly',
        CalendarCheck,
        'from-[#6f3df4] to-[#8b5cf6]',
        'bg-[#efe9ff]',
        'text-[#6f3df4]',
      ],
      [
        'Meal Rate',
        money(dashboard?.currentMealRate),
        'Rate',
        Calculator,
        'from-[#0ea5e9] to-[#2563eb]',
        'bg-[#e0f2fe]',
        'text-[#0284c7]',
      ],
      [
        'Food Expenses',
        money(dashboard?.currentMonthTotalBazar),
        'Food',
        ShoppingCart,
        'from-[#f59e0b] to-[#f97316]',
        'bg-[#fff3df]',
        'text-[#f59e0b]',
      ],
      [
        'Utility Expenses',
        money(dashboard?.extraExpenses),
        'Extra',
        ReceiptText,
        'from-[#8b5cf6] to-[#6f3df4]',
        'bg-[#f3e8ff]',
        'text-[#7c3aed]',
      ],
      [
        'Per Member Utility Charge',
        money(dashboard?.perMemberExtraCharge ?? dashboard?.perExtraExpenses),
        'Per Member',
        HandCoins,
        'from-[#ec4899] to-[#f43f7f]',
        'bg-[#fce7f3]',
        'text-[#db2777]',
      ],
      [
        'Total Deposit',
        money(dashboard?.totalDepositAmount),
        'Deposit',
        ReceiptText,
        'from-[#8b5cf6] to-[#6f3df4]',
        'bg-[#f3e8ff]',
        'text-[#7c3aed]',
      ],
      [
        'Due Amount',
        money(dashboard?.totalDue),
        'Due',
        BadgeDollarSign,
        'from-[#ef4444] to-[#f43f7f]',
        'bg-[#fee2e2]',
        'text-[#dc2626]',
      ],
    ] as const
  }, [adminDashboard, messDashboard, user?.role])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-bold text-[#6b7a99]">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title={user.role === 'ADMIN' ? 'Super Admin Dashboard' : 'Dashboard'}
        description={activeMess ? `${activeMess.name} overview` : `Welcome back, ${user.name}`}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {!loadingData && !activeMess && user.role !== 'ADMIN' && (
          <div className="mb-7 overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 shadow-sm">
                  <Home size={22} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#172554]">No approved mess found</h2>
                  <p className="mt-0.5 text-sm font-semibold text-[#6b7a99]">
                    Request mess registration or ask your manager to add you.
                  </p>
                </div>
              </div>

              <button
                className="inline-flex h-[45px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-black text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]"
                onClick={() => router.push('/dashboard/mess_management')}
              >
                Request Mess
              </button>
            </div>
          </div>
        )}

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.slice(0, 6).map(([label, value, badge, Icon, accent, iconBg, iconColor]) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              badge={badge}
              icon={Icon}
              accent={accent}
              iconBg={iconBg}
              iconColor={iconColor}
            />
          ))}
        </div>

        {/* Mini Stats Row */}
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {stats.slice(6, 9).map(([label, value, , Icon], index) => (
            <MiniStatCard
              key={label}
              label={label}
              value={value}
              icon={Icon}
              tone={['from-[#f59e0b] to-[#f97316]', 'from-[#10b981] to-[#34d399]', 'from-[#ef4444] to-[#f43f5e]'][index]}
            />
          ))}
        </div>

        {/* Charts Row - only for non-admin users */}
        {user.role !== 'ADMIN' && (
          <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.85fr_.7fr]">
            {/* Monthly Overview - Line Chart */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-5 text-sm font-black text-[#172554]">Monthly Overview</h3>

              {chartLoading ? (
                <ChartSkeleton />
              ) : monthlyOverview.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyOverview}>
                    <CartesianGrid stroke="#e6ebf4" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#6b7a99' }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#6b7a99' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="income" stroke="#2f80ed" strokeWidth={3} dot={false} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#58d68d" strokeWidth={3} dot={false} name="Expense" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center">
                  <div className="text-center">
                    <TrendingUp size={32} className="mx-auto mb-2 text-[#cbd5e1]" />
                    <p className="text-sm font-semibold text-[#6b7a99]">No data available for this month</p>
                  </div>
                </div>
              )}
            </div>

            {/* Expense Breakdown - Pie Chart */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-5 text-sm font-black text-[#172554]">Expense Breakdown</h3>

              {chartLoading ? (
                <ChartSkeleton height={250} />
              ) : expenseBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={expenseBreakdown} dataKey="value" innerRadius={58} outerRadius={92}>
                        {expenseBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-2 grid gap-2">
                    {expenseBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2 text-[#172554]">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: item.color }}
                          />
                          {item.name}
                        </span>
                        <span className="font-semibold text-[#6b7a99]">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[250px] items-center justify-center">
                  <div className="text-center">
                    <TrendingDown size={32} className="mx-auto mb-2 text-[#cbd5e1]" />
                    <p className="text-sm font-semibold text-[#6b7a99]">No expenses recorded</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Notices / Receipts */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-4 text-sm font-black text-[#172554]">
                Recent Notices
              </h3>

              <div className="space-y-3">
                {(messDashboard?.notices?.length
                  ? messDashboard.notices
                  : [
                    {
                      id: '1',
                      title: 'Payment deadline reminder',
                      type: 'PAYMENT',
                      is_pinned: false,
                      created_at: '',
                    },
                    {
                      id: '2',
                      title: 'Dinner will be served at 9 PM',
                      type: 'MEAL',
                      is_pinned: false,
                      created_at: '',
                    },
                  ]
                ).map((notice) => (
                  <div
                    key={notice.id}
                    className="flex items-start gap-3 rounded-xl border border-[#e6ebf4] bg-white p-3 transition hover:border-[#a9ccfb] hover:bg-[#f8faff]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600">
                      <Bell size={16} />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#172554]">{notice.title}</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">{notice.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Admin: show expense receipts instead of charts */}
        {user.role === 'ADMIN' && (
          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_.75fr]">
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-4 text-sm font-black text-[#172554]">Recent Expense Receipts</h3>
              <div className="space-y-3">
                {adminDashboard?.recentExpenses?.length ? (
                  adminDashboard.recentExpenses.map((expense) => (
                    <a
                      key={expense.id}
                      href={expense.receipt_url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 rounded-xl border border-[#e6ebf4] bg-white p-3 transition hover:border-[#a9ccfb] hover:bg-[#f8faff]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2f80ed]/10 to-[#8b5cf6]/10 text-[#2f80ed]">
                        <ReceiptText size={16} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172554]">
                          {expense.item_name || expense.category}
                        </p>
                        <p className="truncate text-xs font-semibold text-[#6b7a99]">
                          {expense.mess?.name ?? 'Mess'} - {money(expense.amount)}
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-[#6b7a99]">No uploaded receipts yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Row - Meals Bar Chart + Quick Actions (non-admin) */}
        {user.role !== 'ADMIN' && (
          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_.75fr]">
            {/* Weekly Meal Count - Bar Chart */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-4 text-sm font-black text-[#172554]">Meal Count This Week</h3>

              {chartLoading ? (
                <ChartSkeleton height={260} />
              ) : weeklyMeals.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyMeals}>
                    <CartesianGrid stroke="#e6ebf4" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#6b7a99' }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#6b7a99' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="breakfast" fill="#2f80ed" radius={[4, 4, 0, 0]} name="Breakfast" />
                    <Bar dataKey="lunch" fill="#58d68d" radius={[4, 4, 0, 0]} name="Lunch" />
                    <Bar dataKey="dinner" fill="#ffb84d" radius={[4, 4, 0, 0]} name="Dinner" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center">
                  <div className="text-center">
                    <UtensilsCrossed size={32} className="mx-auto mb-2 text-[#cbd5e1]" />
                    <p className="text-sm font-semibold text-[#6b7a99]">No meal data this week</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {user.role !== 'MEMBER' && (
              <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
                <h3 className="mb-5 text-sm font-black text-[#172554]">
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-2">
                  {dashboardQuickActions.map(([label, Icon, href]) => (
                    <button
                      key={label}
                      onClick={() => router.push(href)}
                      className="group rounded-xl border border-[#e6ebf4] bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#a9ccfb] hover:bg-[#f8faff] hover:shadow-md"
                    >
                      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#2f80ed] transition group-hover:bg-gradient-to-br group-hover:from-[#2f80ed] group-hover:to-[#3b8cff] group-hover:text-white">
                        <Icon size={20} />
                      </span>

                      <span className="text-xs font-black text-[#172554]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}