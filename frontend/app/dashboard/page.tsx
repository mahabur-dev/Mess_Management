'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AdminDashboard, type Mess, type MessDashboard } from '@/lib/api-client'
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
} from 'recharts'
import {
  Bell,
  ClipboardList,
  CreditCard,
  Plus,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
  Users,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const lineData = [
  { day: '01 May', income: 35, expense: 16 },
  { day: '05 May', income: 59, expense: 30 },
  { day: '10 May', income: 31, expense: 33 },
  { day: '15 May', income: 38, expense: 56 },
  { day: '20 May', income: 50, expense: 22 },
  { day: '25 May', income: 31, expense: 36 },
  { day: '30 May', income: 46, expense: 31 },
]

const mealData = [
  { day: 'Mon', breakfast: 82, lunch: 54, dinner: 70 },
  { day: 'Tue', breakfast: 44, lunch: 38, dinner: 36 },
  { day: 'Wed', breakfast: 60, lunch: 42, dinner: 58 },
  { day: 'Thu', breakfast: 75, lunch: 56, dinner: 70 },
  { day: 'Sat', breakfast: 45, lunch: 68, dinner: 100 },
  { day: 'Sun', breakfast: 70, lunch: 38, dinner: 70 },
]

const pieData = [
  { name: 'Food & Groceries', value: 65, color: '#2f80ed' },
  { name: 'Utilities', value: 15, color: '#6f3df4' },
  { name: 'Rent', value: 10, color: '#b642d9' },
  { name: 'Others', value: 10, color: '#ff4f8a' },
]

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: string | number
  change: string
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <Card className="app-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${bg}`}>
          <Icon size={21} className={color} />
        </span>
        <span className="text-xs font-black text-[#22b66f]">{change}</span>
      </div>
      <p className="mt-4 text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#0a1433]">{value}</p>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [messes, setMesses] = useState<Mess[]>([])
  const [messDashboard, setMessDashboard] = useState<MessDashboard | null>(null)
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess

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
          const dashboard = await apiClient.getMessDashboard(list[0].id).catch(() => null)
          if (mounted && dashboard) setMessDashboard(dashboard.data)
        }
      } finally {
        if (mounted) setLoadingData(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  const stats = useMemo(() => {
    if (user?.role === 'ADMIN' && adminDashboard) {
      return [
        ['Total Users', adminDashboard.users, '+12%', Users, 'bg-[#e8f2ff]', 'text-[#2f80ed]'],
        ['All Messes', adminDashboard.messes, '+8%', WalletCards, 'bg-[#e8fff2]', 'text-[#22b66f]'],
        ['Pending Requests', adminDashboard.pendingRequests, '+0%', ClipboardList, 'bg-[#fff3df]', 'text-[#f59e0b]'],
        ['Pending Payments', adminDashboard.pendingPayments, '+5%', CreditCard, 'bg-[#ffe8f0]', 'text-[#f43f7f]'],
      ] as const
    }
    return [
      ['Total Members', messDashboard?.activeMembers ?? 0, '+12%', Users, 'bg-[#e8f2ff]', 'text-[#2f80ed]'],
      ['Meals Today', messDashboard?.todayTotalMeals ?? 0, '+8%', UtensilsCrossed, 'bg-[#e8fff2]', 'text-[#22b66f]'],
      ['Monthly Expenses', money(messDashboard?.currentMonthTotalBazar), '-3%', ClipboardList, 'bg-[#fff1df]', 'text-[#f59e0b]'],
      ['Due Amount', money(messDashboard?.totalDue), '-5%', WalletCards, 'bg-[#ffe8f0]', 'text-[#f43f7f]'],
    ] as const
  }, [adminDashboard, messDashboard, user?.role])

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={user.role === 'ADMIN' ? 'Super Admin Dashboard' : 'Dashboard'}
        description={activeMess ? `${activeMess.name} overview` : `Welcome back, ${user.name}`}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {!loadingData && !activeMess && user.role !== 'ADMIN' && (
          <div className="app-card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">No approved mess found</h2>
              <p className="text-sm font-semibold text-muted-foreground">Request mess registration or ask your manager to add you.</p>
            </div>
            <Button
              className="gradient-button rounded-lg font-bold"
              onClick={() => router.push('/dashboard/mess_management')}
            >
              Request Mess
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, change, Icon, bg, color]) => (
            <StatCard key={label} label={label} value={value} change={change} icon={Icon} bg={bg} color={color} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.85fr_.7fr]">
          <Card className="app-card p-5">
            <h3 className="mb-5 text-sm font-black text-[#0a1433]">Monthly Overview</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <CartesianGrid stroke="#eef2f8" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <Line type="monotone" dataKey="income" stroke="#31c77f" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#ff4f8a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="app-card p-5">
            <h3 className="mb-5 text-sm font-black text-[#0a1433]">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={58} outerRadius={92}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid gap-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.name}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-5">
            <h3 className="mb-4 text-sm font-black text-[#0a1433]">Recent Notices</h3>
            <div className="space-y-3">
              {(messDashboard?.notices?.length ? messDashboard.notices : [
                { id: '1', title: 'Payment deadline reminder', type: 'PAYMENT', is_pinned: false, created_at: '' },
                { id: '2', title: 'Dinner will be served at 9 PM', type: 'MEAL', is_pinned: false, created_at: '' },
              ]).map((notice) => (
                <div key={notice.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#efe9ff] text-[#6f3df4]">
                    <Bell size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{notice.title}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{notice.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.75fr]">
          <Card className="app-card p-5">
            <h3 className="mb-4 text-sm font-black text-[#0a1433]">Meal Count (This Week)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mealData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <Bar dataKey="breakfast" fill="#6f3df4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lunch" fill="#2787f5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dinner" fill="#ffb21a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="app-card p-5">
            <h3 className="mb-5 text-sm font-black text-[#0a1433]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-2">
              {[
                ['Add Member', Users, '/dashboard/member_management'],
                ['Add Expense', WalletCards, '/dashboard/finance'],
                ['Add Meal Plan', UtensilsCrossed, '/dashboard/meals'],
                ['Send Notice', Bell, '/dashboard/notices'],
              ].map(([label, Icon]) => (
                <button key={label as string} className="rounded-lg border border-border bg-[#fbfcff] p-4 text-center transition hover:border-[#c8befb] hover:bg-[#f7f4ff]">
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
                    <Icon size={20} />
                  </span>
                  <span className="text-xs font-black text-[#0a1433]">{label as string}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
