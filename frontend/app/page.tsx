'use client'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  PlayCircle,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
  Users,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
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

const mealData = [
  { day: 'Mon', breakfast: 82, lunch: 54, dinner: 70 },
  { day: 'Tue', breakfast: 44, lunch: 38, dinner: 36 },
  { day: 'Wed', breakfast: 60, lunch: 42, dinner: 58 },
  { day: 'Thu', breakfast: 75, lunch: 56, dinner: 70 },
  { day: 'Sat', breakfast: 45, lunch: 68, dinner: 100 },
  { day: 'Sun', breakfast: 70, lunch: 38, dinner: 70 },
]

const lineData = [
  { day: '01 May', income: 35, expense: 16 },
  { day: '05 May', income: 59, expense: 30 },
  { day: '10 May', income: 31, expense: 33 },
  { day: '15 May', income: 38, expense: 56 },
  { day: '20 May', income: 50, expense: 22 },
  { day: '25 May', income: 31, expense: 36 },
  { day: '30 May', income: 46, expense: 31 },
]

const pieData = [
  { name: 'Food', value: 65, color: '#2f80ed' },
  { name: 'Utilities', value: 15, color: '#6f3df4' },
  { name: 'Rent', value: 10, color: '#b642d9' },
  { name: 'Others', value: 10, color: '#ff4f8a' },
]

const features = [
  { icon: UtensilsCrossed, title: 'Meal Management', text: 'Plan & track meals easily', color: 'text-[#6f3df4]', bg: 'bg-[#efe9ff]' },
  { icon: Users, title: 'Member Management', text: 'Add & manage members', color: 'text-[#22b66f]', bg: 'bg-[#e8fff2]' },
  { icon: WalletCards, title: 'Finance Tracking', text: 'Track income & expenses', color: 'text-[#f59e0b]', bg: 'bg-[#fff3df]' },
  { icon: ShoppingCart, title: 'Shopping Lists', text: 'Create & manage lists', color: 'text-[#f43f7f]', bg: 'bg-[#ffe8f0]' },
  { icon: CheckCircle2, title: 'Attendance Tracking', text: 'Track attendance in real-time', color: 'text-[#2f80ed]', bg: 'bg-[#e8f2ff]' },
  { icon: BarChart3, title: 'Reports & Analytics', text: 'Get insights & reports', color: 'text-[#6f3df4]', bg: 'bg-[#efe9ff]' },
]

function MiniSidebar() {
  const items = [
    ['Dashboard', BarChart3],
    ['Members', Users],
    ['Meals', UtensilsCrossed],
    ['Finance', TrendingUp],
    ['Shopping', ShoppingCart],
    ['Attendance', CalendarCheck],
    ['Notices', Bell],
    ['Reports', ClipboardList],
  ] as const
  return (
    <div className="hidden w-[190px] shrink-0 flex-col bg-gradient-to-b from-[#17106b] to-[#21157a] p-5 text-white md:flex">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-xs font-black text-[#6f3df4]">M</span>
        <span className="font-black">Mess.</span>
      </div>
      <div className="space-y-1.5">
        {items.map(([label, Icon], index) => (
          <div key={label} className={`flex h-9 items-center gap-3 rounded-md px-3 text-xs font-bold ${index === 0 ? 'bg-[#7442f4]' : 'text-white/82'}`}>
            <Icon size={14} />
            {label}
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-lg bg-white/7 p-3">
        <span className="h-8 w-8 rounded-full bg-white/90" />
        <div>
          <p className="text-xs font-black">MR It Ltd</p>
          <p className="text-[10px] text-white/60">Organizer</p>
        </div>
      </div>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="glass-panel overflow-hidden rounded-xl">
      <div className="flex min-h-[510px]">
        <MiniSidebar />
        <div className="min-w-0 flex-1 bg-white p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0a1433] sm:text-2xl">Welcome back, MR It Ltd!</h2>
              <p className="mt-1 text-xs font-semibold text-[#667085]">Here’s what’s happening with your mess today.</p>
            </div>
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-[#667085]" />
              <span className="hidden rounded-lg border border-border px-4 py-2 text-xs font-bold text-[#0a1433] sm:inline">May 19, 2026</span>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Total Members', '150', '+12%', Users, 'bg-[#efe9ff]', 'text-[#6f3df4]'],
              ['Meals Today', '95', '+8%', UtensilsCrossed, 'bg-[#e8fff2]', 'text-[#22b66f]'],
              ['Total Expenses', '৳45,680', '-3%', ClipboardList, 'bg-[#fff1df]', 'text-[#f59e0b]'],
              ['Attendance Rate', '92%', '+5%', TrendingUp, 'bg-[#efe9ff]', 'text-[#6f3df4]'],
            ].map(([label, value, change, Icon, bg, color]) => (
              <div key={label as string} className="app-card p-4">
                <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
                  <Icon size={18} className={color as string} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="mb-2 text-xs font-bold text-[#667085]">{label as string}</p>
                    <p className="text-xl font-black text-[#0a1433]">{value as string}</p>
                  </div>
                  <span className="text-xs font-black text-[#22b66f]">{change as string}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="app-card p-5">
              <h3 className="mb-4 text-sm font-black text-[#0a1433]">Meal Count (This Week)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={mealData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} />
                  <Bar dataKey="breakfast" fill="#6f3df4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lunch" fill="#2787f5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dinner" fill="#ffb21a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="app-card p-5">
              <h3 className="mb-4 text-sm font-black text-[#0a1433]">Recent Activities</h3>
              <div className="space-y-4">
                {['New member added', 'Meal plan updated', 'Payment received', 'Shopping list updated'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f4f7fb] text-[#6f3df4]">
                        {index + 1}
                      </span>
                      <span className="font-bold text-[#0a1433]">{item}</span>
                    </div>
                    <span className="text-[#667085]">{index ? `${index * 15} min ago` : '2 min ago'}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-xs font-black text-[#6f3df4]">View All Activities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardStrip() {
  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[210px_1fr] lg:px-8">
        <MiniSidebar />
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#0a1433]">Dashboard</h2>
              <p className="text-sm font-semibold text-muted-foreground">Overview of your mess management system</p>
            </div>
            <Button className="gradient-button rounded-lg font-bold">Quick Add</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_.9fr_.7fr]">
            <div className="app-card p-5">
              <h3 className="mb-5 text-sm font-black">Monthly Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid stroke="#eef2f8" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} />
                  <Line type="monotone" dataKey="income" stroke="#31c77f" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#ff4f8a" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="app-card p-5">
              <h3 className="mb-5 text-sm font-black">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={1}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="app-card p-5">
              <h3 className="mb-4 text-sm font-black">Upcoming Payments</h3>
              <div className="space-y-4">
                {['Rent Payment', 'Electricity Bill', 'Gas Bill'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#fff3df] text-[#c98013]">
                        <CreditCard size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-black">{item}</p>
                        <p className="text-xs text-muted-foreground">Due in {index + 3} days</p>
                      </div>
                    </div>
                    <p className="text-sm font-black">৳{[15000, 3250, 1450][index].toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8fbff] text-[#0a1433]">
      <Navbar />
      <section className="overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.76fr_1.24fr]">
          <div>
            <div className="mb-8 inline-flex rounded-full bg-[#f0edff] px-4 py-2 text-xs font-black text-[#5d36e8]">
              All-in-One Mess Management Solution
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Manage Your Mess <span className="text-[#6f3df4]">Smartly</span> & Easily
            </h1>
            <p className="mt-7 max-w-xl text-lg font-semibold leading-8 text-[#334155]">
              A complete platform to manage meals, members, finances, shopping, attendance and everything in one place.
              Save time, reduce hassle, focus on what matters.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="gradient-button h-12 rounded-lg px-7 font-black">
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-lg border-[#c8befb] bg-white px-7 font-black text-[#6f3df4]">
                <Link href="#features">Explore Features <PlayCircle size={18} className="ml-2" /></Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {['A', 'R', 'S', 'M'].map((name, index) => (
                  <span key={name} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#efe9ff] text-sm font-black text-[#6f3df4] shadow" style={{ zIndex: 4 - index }}>
                    {name}
                  </span>
                ))}
              </div>
              <div className="text-[#ffb21a]">★★★★★</div>
              <p className="text-sm font-bold text-[#334155]">from 2K+ happy users</p>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="features" className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-xl border border-border bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:grid-cols-2 lg:grid-cols-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="flex items-center gap-4 border-border py-2 lg:border-r lg:last:border-r-0">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${feature.bg}`}>
                  <Icon size={22} className={feature.color} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black">{feature.title}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{feature.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <DashboardStrip />

      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            ['Register', 'Create your account and complete profile.'],
            ['Request Mess', 'Submit mess registration and wait for approval.'],
            ['Operate Easily', 'Manage members, meals, bills, payments and notices.'],
          ].map(([title, text], index) => (
            <div key={title} className="app-card p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe9ff] text-lg font-black text-[#6f3df4]">{index + 1}</span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-2 font-semibold leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
