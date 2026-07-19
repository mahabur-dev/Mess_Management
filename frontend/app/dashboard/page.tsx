'use client'

import dynamic from 'next/dynamic'
import { DashboardHeader } from '@/components/dashboard-header'
import { MemberJoinRequestModal } from '@/components/member-join-request-modal'
import { useAuth } from '@/app/context/auth-context'
import { type Mess } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import {
  useMesses,
  useMessDashboard,
  useAdminDashboard,
  useMonthlyOverview,
  useExpenseBreakdown,
  useWeeklyMealCount,
} from '@/hooks/use-dashboard-data'
import {
  BadgeDollarSign,
  Bell,
  Building2,
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
  UserPlus,
  WalletCards,
  ArrowUpRight,
} from 'lucide-react'
import { useMemo, useState, type ElementType, type ReactNode } from 'react'

// ─── Lazy-loaded Chart Components ─────────────────────────────
const MonthlyOverviewChart = dynamic(
  () =>
    import('@/components/dashboard/monthly-overview-chart').then(
      (mod) => ({ default: mod.MonthlyOverviewChart }),
    ),
  { ssr: false },
)

const ExpenseBreakdownChart = dynamic(
  () =>
    import('@/components/dashboard/expense-breakdown-chart').then(
      (mod) => ({ default: mod.ExpenseBreakdownChart }),
    ),
  { ssr: false },
)

const WeeklyMealsChart = dynamic(
  () =>
    import('@/components/dashboard/weekly-meals-chart').then(
      (mod) => ({ default: mod.WeeklyMealsChart }),
    ),
  { ssr: false },
)

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
  ['Subscriptions', BadgeDollarSign, '/dashboard/subscriptions'],
  ['Reports', ReceiptText, '/dashboard/reports'],
] as const

const dashboardQuickActionButtonClass =
  'group rounded-xl border border-[var(--brand-border-subtle)] bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:shadow-md'
const dashboardQuickActionIconClass =
  'mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--brand-border)] bg-white text-[var(--brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition group-hover:border-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white group-hover:shadow-[0_10px_22px_var(--brand-shadow)]'

const mobileQuickActions = [
  {
    label: 'Add Meals',
    helper: 'Daily sheet',
    href: '/dashboard/meals',
    icon: UtensilsCrossed,
    tone: 'blue',
  },
  {
    label: 'Add Expenses',
    helper: 'Bazar costs',
    href: '/dashboard/finance',
    icon: WalletCards,
    tone: 'green',
  },
  {
    label: 'Add Payments',
    helper: 'Deposit entry',
    href: '/dashboard/payments',
    icon: CreditCard,
    tone: 'orange',
  },
  {
    label: 'Monthly Bill',
    helper: 'View details',
    href: '/dashboard/monthly-bills',
    icon: ClipboardList,
    tone: 'purple',
  },
  {
    label: 'Send Notice',
    helper: 'Message all',
    href: '/dashboard/notices',
    icon: Bell,
    tone: 'rose',
  },
] as const

const managerMobileQuickActions = [
  {
    label: 'Add Member',
    helper: 'Invite user',
    href: '/dashboard/member_management',
    icon: UserPlus,
    tone: 'blue',
  },
  ...mobileQuickActions,
] as const

const adminMobileQuickActions = [
  {
    label: 'Manage Users',
    helper: 'Accounts',
    href: '/dashboard/users',
    icon: Users,
    tone: 'blue',
  },
  {
    label: 'Mess Requests',
    helper: 'Approvals',
    href: '/dashboard/mess_requests',
    icon: ClipboardList,
    tone: 'orange',
  },
  {
    label: 'All Messes',
    helper: 'Overview',
    href: '/dashboard/mess_management',
    icon: Home,
    tone: 'green',
  },
  {
    label: 'Complaints',
    helper: 'Issues',
    href: '/dashboard/complaints',
    icon: Bell,
    tone: 'rose',
  },
  {
    label: 'Subscriptions',
    helper: 'Manage plans',
    href: '/dashboard/subscriptions',
    icon: BadgeDollarSign,
    tone: 'purple',
  },
  {
    label: 'Reports',
    helper: 'Analytics',
    href: '/dashboard/reports',
    icon: ReceiptText,
    tone: 'cyan',
  },
] as const

const mobileActionTones = {
  blue: {
    shell: 'from-[#e7f1ff] to-[#f4f8ff]',
    icon: 'bg-[#e7f1ff] text-[#2f80ed]',
    ring: 'bg-[#2f80ed]/10',
  },
  green: {
    shell: 'from-[#ecfff5] to-[#f8fffb]',
    icon: 'bg-[#e8fff2] text-[#22b66f]',
    ring: 'bg-[#58d68d]/12',
  },
  orange: {
    shell: 'from-[#fff5e6] to-[#fffaf3]',
    icon: 'bg-[#fff3df] text-[#f59e0b]',
    ring: 'bg-[#ffb84d]/14',
  },
  purple: {
    shell: 'from-[#f1edff] to-[#fbfaff]',
    icon: 'bg-[#efe9ff] text-[#6f3df4]',
    ring: 'bg-[#6f3df4]/10',
  },
  cyan: {
    shell: 'from-[#e7f8ff] to-[#f6fcff]',
    icon: 'bg-[#e0f2fe] text-[#0284c7]',
    ring: 'bg-[#19b6ff]/12',
  },
  rose: {
    shell: 'from-[#fff0f4] to-[#fff8fa]',
    icon: 'bg-[#ffe8f0] text-[#f43f7f]',
    ring: 'bg-[#f43f7f]/12',
  },
} as const

type MobileAction = (
  | typeof mobileQuickActions
  | typeof managerMobileQuickActions
  | typeof adminMobileQuickActions
)[number]
type MobileStat = readonly [
  string,
  string | number,
  string,
  ElementType,
  string,
  string,
  string,
]

type MobileNotice = {
  id: string
  title: string
  type?: string | null
}

function currentMonthValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
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
    <div
      className={`group relative min-h-[92px] overflow-hidden rounded-xl bg-gradient-to-r ${accent} p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]`}
    >
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
    <div
      className={`group relative min-h-[92px] overflow-hidden rounded-xl bg-gradient-to-r ${tone} p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]`}
    >
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-white/80">
            {label}
          </p>
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

// ─── Main Dashboard Page ──────────────────────────────────────
function MobileSection({
  eyebrow,
  title,
  actionLabel,
  onAction,
  children,
}: {
  eyebrow?: string
  title: string
  actionLabel?: string
  onAction?: () => void
  children: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#e6ebf4] bg-white p-4 shadow-[0_14px_34px_rgba(65,103,153,0.10)]">
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#2f80ed]/8 blur-2xl" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-1 text-[17px] font-black tracking-tight text-[#172554]">
              {title}
            </h2>
          </div>

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e7f1ff] px-3 py-1.5 text-[11px] font-black text-[#2f80ed] transition active:scale-[0.97]"
            >
              {actionLabel}
              <ArrowUpRight size={12} />
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

function MobileQuickActions({
  actions,
  onNavigate,
}: {
  actions: readonly MobileAction[]
  onNavigate: (href: string) => void
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#172554] via-[#2f80ed] to-[#3b8cff] p-[1px] shadow-[0_20px_45px_rgba(47,128,237,0.20)]">
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/20 blur-xl" />
      <div className="relative rounded-[29px] bg-white/95 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">
              Start Here
            </p>
            <h2 className="mt-1 text-[18px] font-black tracking-tight text-[#172554]">
              Quick Actions
            </h2>
          </div>
          <span className="rounded-full bg-[#f0f6ff] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">
            Today
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {actions.map(({ label, helper, href, icon: Icon, tone }) => {
            const palette = mobileActionTones[tone]
            return (
              <button
                key={label}
                type="button"
                onClick={() => onNavigate(href)}
                className={`group relative min-h-[96px] overflow-hidden rounded-[20px] border border-white bg-gradient-to-br ${palette.shell} p-2.5 text-left shadow-[0_8px_18px_rgba(65,103,153,0.08)] transition active:scale-[0.97]`}
              >
                <span
                  className={`absolute -right-5 -top-5 h-12 w-12 rounded-full ${palette.ring} blur-sm transition group-active:scale-125`}
                />
                <span
                  className={`relative mb-2 grid h-10 w-10 place-items-center rounded-[14px] ${palette.icon} shadow-sm`}
                >
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <span className="relative block text-[11px] font-black leading-tight text-[#172554]">
                  {label}
                </span>
                <span className="relative mt-1 block text-[9px] font-bold leading-tight text-[#7a8aaa]">
                  {helper}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MobileOverviewGrid({ stats }: { stats: readonly MobileStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(([label, value, , Icon, , iconBg, iconColor], index) => (
        <div
          key={label}
          className={`relative overflow-hidden rounded-[20px] border border-[#e6ebf4] bg-white p-3.5 shadow-[0_10px_24px_rgba(65,103,153,0.08)] ${
            index === 0 ? 'col-span-2' : ''
          }`}
        >
          <div className="absolute -right-7 -top-8 h-20 w-20 rounded-full bg-[#2f80ed]/6 blur-xl" />
          <div className="relative flex items-start gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${iconBg} ${iconColor}`}
            >
              <Icon size={18} strokeWidth={2.35} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#7a8aaa]">
                {label}
              </p>
              <p className="mt-1 truncate text-[18px] font-black leading-none tracking-tight text-[#172554]">
                {value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MobileNoticeList({
  notices,
  onNavigate,
}: {
  notices: readonly MobileNotice[]
  onNavigate: (href: string) => void
}) {
  const fallbackNotices: MobileNotice[] = [
    { id: 'fallback-1', title: 'Payment deadline reminder', type: 'PAYMENT' },
    { id: 'fallback-2', title: 'Dinner will be served at 9 PM', type: 'MEAL' },
  ]
  const visibleNotices = notices.length ? notices : fallbackNotices

  return (
    <div className="space-y-2.5">
      {visibleNotices.slice(0, 3).map((notice) => (
        <button
          key={notice.id}
          type="button"
          onClick={() => onNavigate('/dashboard/notices')}
          className="flex w-full items-center gap-3 rounded-[18px] border border-[#e6ebf4] bg-[#fbfdff] p-3 text-left transition active:scale-[0.98]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e7f1ff] text-[#2f80ed]">
            <Bell size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black text-[#172554]">
              {notice.title}
            </span>
            <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a8aaa]">
              {notice.type ?? 'NOTICE'}
            </span>
          </span>
          <ArrowUpRight size={15} className="text-[#a0aec5]" />
        </button>
      ))}
    </div>
  )
}

function MobileNoMessPrompt({
  onCreate,
  onRequestMember,
}: {
  onCreate: () => void
  onRequestMember: () => void
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[0_12px_28px_rgba(245,158,11,0.12)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-amber-100 text-amber-600">
          <Home size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-[#172554]">
            No mess found
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-[#6b7a99]">
            Create your own mess or request access from an active mess manager.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 text-xs font-black text-white shadow-[0_8px_20px_rgba(47,128,237,0.24)]"
            >
              <Building2 size={14} />
              Create Mess
            </button>
            <button
              type="button"
              onClick={onRequestMember}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e6f8] bg-white px-4 text-xs font-black text-[#2f80ed] shadow-sm"
            >
              <UserPlus size={14} />
              Request Member
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)
  const [memberRequestOpen, setMemberRequestOpen] = useState(false)

  // ── SWR data fetching (parallel, cached) ────────────────────
  const { data: messesData, isLoading: messesLoading } = useMesses()
  const { data: adminDashboard } = useAdminDashboard(user?.role === 'ADMIN')
  const { data: messDashboard } = useMessDashboard(
    undefined,
    selectedMonth,
  )
  const { data: monthlyOverview } = useMonthlyOverview(
    undefined,
    selectedMonth,
  )
  const { data: expenseBreakdown } = useExpenseBreakdown(undefined, selectedMonth)
  const { data: weeklyMeals } = useWeeklyMealCount(undefined)

  // ── Derive active mess and conditional SWR keys ─────────────
  const messes = useMemo(() => {
    const list = Array.isArray(messesData)
      ? messesData
      : messesData
        ? [messesData]
        : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
    return list
  }, [messesData, user])

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const messId = activeMess?.id

  // Re-invoke hooks with resolved messId
  // (SWR dedupes by key, so these will share the cache if key matches)
  const {
    data: messDashboardResolved,
    isLoading: loadingMessDashboardResolved,
  } = useMessDashboard(messId, selectedMonth)
  const { data: monthlyOverviewResolved, isLoading: loadingChartsResolved } = useMonthlyOverview(
    messId,
    selectedMonth,
  )
  const { data: expenseBreakdownResolved } = useExpenseBreakdown(messId, selectedMonth)
  const { data: weeklyMealsResolved } = useWeeklyMealCount(messId)

  // Use resolved data when available, fall back to initial fetch
  const resolvedDashboard = messId ? messDashboardResolved : messDashboard
  const resolvedMonthlyOverview = messId ? monthlyOverviewResolved : monthlyOverview
  const resolvedExpenseBreakdown = messId ? expenseBreakdownResolved : expenseBreakdown
  const resolvedWeeklyMeals = messId ? weeklyMealsResolved : weeklyMeals
  const chartLoading = messId ? loadingChartsResolved : false

  const dashboardQuickActions =
    user?.role === 'ADMIN' ? adminQuickActions : quickActions

  const stats = useMemo(() => {
    const dashboard = resolvedDashboard as
      | (NonNullable<typeof resolvedDashboard> & {
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
  }, [adminDashboard, resolvedDashboard, user?.role])

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-bold text-[#6b7a99]">
        Loading...
      </div>
    )
  }

  const mobileActions =
    user.role === 'ADMIN'
      ? adminMobileQuickActions
      : user.role === 'MANAGER' || user.role === 'ORGANIZER'
        ? managerMobileQuickActions
        : mobileQuickActions
  const mobileNotices = (resolvedDashboard?.notices ?? []) as MobileNotice[]

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title={user.role === 'ADMIN' ? 'Super Admin Dashboard' : 'Dashboard'}
        description={
          activeMess
            ? `${activeMess.name} overview`
            : `Welcome back, ${user.name}`
        }
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        showQuickAddButton={Boolean(activeMess)}
      />

      <div className="p-0 sm:p-6 lg:p-8">
        <div className="space-y-4 px-4 pb-8 pt-4 sm:hidden">
          {!messesLoading && !loadingMessDashboardResolved && !activeMess && user.role !== 'ADMIN' && (
            <MobileNoMessPrompt
              onCreate={() => router.push('/dashboard/mess_management')}
              onRequestMember={() => setMemberRequestOpen(true)}
            />
          )}

          <MobileQuickActions
            actions={mobileActions}
            onNavigate={(href) => router.push(href)}
          />

          <MobileSection
            eyebrow="Live Overview"
            title={user.role === 'ADMIN' ? 'Platform Details' : 'Mess Details'}
            actionLabel="View Details"
            onAction={() => router.push(user.role === 'ADMIN' ? '/dashboard/reports' : '/dashboard/monthly-bills')}
          >
            <MobileOverviewGrid stats={stats as readonly MobileStat[]} />
          </MobileSection>

          {user.role !== 'ADMIN' && (
            <>
              <MobileSection
                eyebrow="This Month"
                title="Monthly Overview"
                actionLabel="Reports"
                onAction={() => router.push('/dashboard/reports')}
              >
                <div className="-mx-2 overflow-hidden">
                  <MonthlyOverviewChart
                    data={resolvedMonthlyOverview ?? []}
                    isLoading={chartLoading ?? false}
                  />
                </div>
              </MobileSection>

              <MobileSection eyebrow="Costs" title="Expense Breakdown">
                <ExpenseBreakdownChart
                  data={resolvedExpenseBreakdown?.data ?? []}
                  isLoading={chartLoading ?? false}
                />
              </MobileSection>

              <MobileSection
                eyebrow="Meals"
                title="Meal Count This Week"
                actionLabel="Meals"
                onAction={() => router.push('/dashboard/meals')}
              >
                <div className="-mx-2 overflow-hidden">
                  <WeeklyMealsChart
                    data={resolvedWeeklyMeals ?? []}
                    isLoading={chartLoading ?? false}
                  />
                </div>
              </MobileSection>

              <MobileSection
                eyebrow="Notice Board"
                title="Recent Notices"
                actionLabel="All"
                onAction={() => router.push('/dashboard/notices')}
              >
                <MobileNoticeList
                  notices={mobileNotices}
                  onNavigate={(href) => router.push(href)}
                />
              </MobileSection>
            </>
          )}

          {user.role === 'ADMIN' && (
            <MobileSection
              eyebrow="Admin"
              title="Recent Expense Receipts"
              actionLabel="Reports"
              onAction={() => router.push('/dashboard/reports')}
            >
              <div className="space-y-2.5">
                {adminDashboard?.recentExpenses?.length ? (
                  adminDashboard.recentExpenses.slice(0, 4).map((expense) => (
                    <a
                      key={expense.id}
                      href={expense.receipt_url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-[18px] border border-[#e6ebf4] bg-[#fbfdff] p-3 transition active:scale-[0.98]"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e7f1ff] text-[#2f80ed]">
                        <ReceiptText size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#172554]">
                          {expense.item_name || expense.category}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-semibold text-[#6b7a99]">
                          {expense.mess?.name ?? 'Mess'} - {money(expense.amount)}
                        </span>
                      </span>
                      <ArrowUpRight size={15} className="text-[#a0aec5]" />
                    </a>
                  ))
                ) : (
                  <p className="rounded-[18px] border border-[#e6ebf4] bg-[#fbfdff] p-4 text-center text-sm font-semibold text-[#6b7a99]">
                    No uploaded receipts yet.
                  </p>
                )}
              </div>
            </MobileSection>
          )}
        </div>

        <div className="hidden sm:block">
        {!messesLoading && !loadingMessDashboardResolved && !activeMess && user.role !== 'ADMIN' && (
          <div className="mb-7 overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 shadow-sm">
                  <Home size={22} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#172554]">
                    No mess found
                  </h2>
                  <p className="mt-0.5 text-sm font-semibold text-[#6b7a99]">
                    Create your own mess or request access from an active mess manager.
                  </p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
                <button
                  className="inline-flex h-[45px] min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-black text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)] sm:min-w-[150px]"
                  onClick={() => router.push('/dashboard/mess_management')}
                >
                  <Building2 size={17} />
                  Create Mess
                </button>
                <button
                  className="inline-flex h-[45px] min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#d8e6f8] bg-white px-5 font-black text-[#2f80ed] shadow-sm transition hover:border-[#a9ccfb] hover:bg-[#edf5ff] sm:min-w-[150px]"
                  onClick={() => setMemberRequestOpen(true)}
                >
                  <UserPlus size={17} />
                  Request Member
                </button>
              </div>
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
              tone={
                [
                  'from-[#f59e0b] to-[#f97316]',
                  'from-[#10b981] to-[#34d399]',
                  'from-[#ef4444] to-[#f43f5e]',
                ][index]
              }
            />
          ))}
        </div>

        {/* Charts Row - only for non-admin users */}
        {user.role !== 'ADMIN' && (
          <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.85fr_.7fr]">
            {/* Monthly Overview - Line Chart */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-5 text-sm font-black text-[#172554]">
                Monthly Overview
              </h3>
              <MonthlyOverviewChart
                data={resolvedMonthlyOverview ?? []}
                isLoading={chartLoading ?? false}
              />
            </div>

            {/* Expense Breakdown - Pie Chart */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-5 text-sm font-black text-[#172554]">
                Expense Breakdown
              </h3>
              <ExpenseBreakdownChart
                data={resolvedExpenseBreakdown?.data ?? []}
                isLoading={chartLoading ?? false}
              />
            </div>

            {/* Recent Notices / Receipts */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <h3 className="mb-4 text-sm font-black text-[#172554]">
                Recent Notices
              </h3>

              <div className="space-y-3">
                {(resolvedDashboard?.notices?.length
                  ? resolvedDashboard.notices
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
                      <p className="truncate text-sm font-bold text-[#172554]">
                        {notice.title}
                      </p>
                      <p className="text-xs font-semibold text-[#6b7a99]">
                        {notice.type}
                      </p>
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
              <h3 className="mb-4 text-sm font-black text-[#172554]">
                Recent Expense Receipts
              </h3>
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
                          {expense.mess?.name ?? 'Mess'} -{' '}
                          {money(expense.amount)}
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-[#6b7a99]">
                    No uploaded receipts yet.
                  </p>
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
              <h3 className="mb-4 text-sm font-black text-[#172554]">
                Meal Count This Week
              </h3>

              <WeeklyMealsChart
                data={resolvedWeeklyMeals ?? []}
                isLoading={chartLoading ?? false}
              />
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
                      className={dashboardQuickActionButtonClass}
                    >
                      <span className={dashboardQuickActionIconClass}>
                        <Icon size={20} />
                      </span>

                      <span className="text-xs font-black text-[#172554] transition group-hover:text-[var(--brand)]">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      <MemberJoinRequestModal
        open={memberRequestOpen}
        onClose={() => setMemberRequestOpen(false)}
      />
    </div>
  )
}
