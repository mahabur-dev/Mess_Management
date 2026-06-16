'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  PlayCircle,
  Settings,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
  Users,
  WalletCards,
  ArrowRight,
  Star,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
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

function MiniSidebar() {
  const items = [
    ['Dashboard', LayoutDashboard, true],
    ['Members', Users, false],
    ['Meal Sheet', UtensilsCrossed, false],
    ['Bazar/Expenses', WalletCards, false],
    ['Monthly Bills', ClipboardList, false],
    ['Payments', CreditCard, false],
    ['Notices', Bell, false],
    ['Reports', BarChart3, false],
    ['Settings', Settings, false],
  ] as const

  return (
    <div className="hidden w-[200px] shrink-0 flex-col md:flex" style={{ background: 'linear-gradient(180deg, #172554 0%, #1a2a6c 40%, #1e3a7a 100%)' }}>
      <div className="flex h-[72px] items-center px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed] to-[#3b8cff] text-xs font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)]">
            M
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight leading-none">Mess</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-0.5 px-3 py-1">
        {items.map(([label, Icon, active]) => (
          <div
            key={label}
            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-bold transition ${
              active
                ? 'bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] text-white shadow-[0_8px_20px_rgba(47,128,237,0.38)]'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Icon size={14} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductPreview() {
  const statCards = [
    ['Total Members', '150', Users, 'from-[#2f80ed] to-[#6f3df4]'],
    ['Meals Today', '95', UtensilsCrossed, 'from-[#10b981] to-[#34d399]'],
    ['Total Meals', '320', CalendarCheck, 'from-[#6f3df4] to-[#8b5cf6]'],
    ['Meal Rate', '৳109', TrendingUp, 'from-[#0ea5e9] to-[#2563eb]'],
    ['Food Expenses', '৳45,680', ShoppingCart, 'from-[#f59e0b] to-[#f97316]'],
    ['Extra Expenses', '৳1,590', ClipboardList, 'from-[#8b5cf6] to-[#6f3df4]'],
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e6ebf4] shadow-[0_24px_64px_rgba(47,128,237,0.16)]">
      <div className="flex" style={{ minHeight: 520 }}>
        <MiniSidebar />
        <div className="min-w-0 flex-1 bg-[#fafcff]">
          <div className="flex h-[72px] items-center justify-between px-5 border-b border-[#e6ebf4] bg-white">
            <div>
              <h2 className="text-base font-black text-[#172554]">Dashboard</h2>
              <p className="text-[11px] font-semibold text-[#6b7a99]">Mohakhali best mess overview</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-[#e6ebf4] bg-white px-3 py-1.5 sm:flex">
                <span className="text-[11px] font-bold text-[#6b7a99]">May 19, 2026</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#6f3df4] text-white">
                <Bell size={13} />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-[#e6ebf4] bg-white px-2 py-1">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2f80ed] text-[9px] font-black text-white">M</div>
                <span className="text-[11px] font-bold text-[#172554]">MR It Ltd</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
              {statCards.map(([label, value, Icon, gradient]) => (
                <div
                  key={label as string}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${gradient} p-3 text-white`}
                >
                  <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-white/15 blur-xl" />
                  <div className="relative flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wide text-white/80">{label as string}</p>
                      <p className="mt-1 text-base font-black leading-none">{value as string}</p>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                      <Icon size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-[#e6ebf4] bg-white p-3">
              <p className="mb-2 text-xs font-black text-[#172554]">Monthly Overview</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={mealData} barSize={6}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={9} tick={{ fill: '#6b7a99' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{ fill: '#6b7a99' }} />
                  <Bar dataKey="breakfast" fill="#2f80ed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="lunch" fill="#58d68d" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="dinner" fill="#ffb84d" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SystemFeaturesSection() {
  const features = [
    { icon: UtensilsCrossed, title: 'Meal Operations', text: 'Members can toggle meals, add guests, and managers get a full daily meal sheet at a glance.', color: '#2f80ed', bg: '#e7f1ff', num: '01' },
    { icon: Users, title: 'Member & Role Control', text: 'Invite members, assign roles, and keep every mess member organized from one place.', color: '#10b981', bg: '#ecfdf5', num: '02' },
    { icon: ShoppingCart, title: 'Bazar & Expense Tracking', text: 'Record daily bazar items, categorize expenses, and keep food costs transparent.', color: '#f59e0b', bg: '#fffbeb', num: '03' },
    { icon: CreditCard, title: 'Payments & Monthly Bills', text: 'Generate monthly bills from meals, rent, utilities, deposits, and approved payments.', color: '#ef4444', bg: '#fef2f2', num: '04' },
    { icon: Bell, title: 'Notices & Requests', text: 'Publish notices, manage complaints, and keep approvals clear for managers and members.', color: '#6d28d9', bg: '#f5f3ff', num: '05' },
    { icon: BarChart3, title: 'Reports & Insights', text: 'Understand meals, dues, payments, and mess performance with clean summary dashboards.', color: '#0ea5e9', bg: '#ecfeff', num: '06' },
  ]

  return (
    <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">System Features</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Professional tools for every mess workflow</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-[#6b7a99]">Mess Management brings daily operations, member coordination, billing, shopping, and reporting into one clear management experience.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="group relative overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-6 transition hover:-translate-y-1 hover:border-[#a9ccfb] hover:shadow-[0_22px_55px_rgba(47,128,237,0.12)]">
                <div className="absolute right-5 top-5 text-5xl font-black text-[#f0f6ff]">{feature.num}</div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: feature.bg, color: feature.color }}><Icon size={22} /></div>
                <h3 className="relative mt-5 text-lg font-black text-[#172554]">{feature.title}</h3>
                <p className="relative mt-2 text-sm font-semibold leading-7 text-[#6b7a99]">{feature.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TopMessSection() {
  const messes = [
    { name: 'Mohakhali Premium Mess', area: 'Mohakhali, Dhaka', members: '42', meals: '286', due: '৳12k', accent: 'from-[#2f80ed] to-[#6f3df4]', score: '96%' },
    { name: 'Banani Smart Residence', area: 'Banani, Dhaka', members: '36', meals: '241', due: '৳8k', accent: 'from-[#10b981] to-[#34d399]', score: '94%' },
    { name: 'Dhanmondi Student Home', area: 'Dhanmondi, Dhaka', members: '58', meals: '394', due: '৳19k', accent: 'from-[#f59e0b] to-[#f97316]', score: '92%' },
  ]
  return (
    <section className="bg-[#fafcff] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">Top Mess Showcase</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Demo messes managed beautifully</h2>
          </div>
          <p className="max-w-sm text-sm font-semibold leading-7 text-[#6b7a99]">A quick preview of how different messes monitor members, meals, dues, and daily operations.</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {messes.map((mess, index) => (
            <div key={mess.name} className="relative overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_25px_rgba(65,103,153,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(65,103,153,0.12)]">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${mess.accent}`} />
              <div className="flex items-start justify-between gap-4 pt-3">
                <div>
                  <span className="rounded-full bg-[#e7f1ff] px-3 py-1 text-xs font-black text-[#2f80ed]">Rank #{index + 1}</span>
                  <h3 className="mt-4 text-lg font-black text-[#172554]">{mess.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#6b7a99]">{mess.area}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${mess.accent} text-base font-black text-white`}>M</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[['Members', mess.members], ['Meals', mess.meals], ['Due', mess.due]].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#fafcff] p-3 text-center">
                    <p className="text-[10px] font-bold text-[#6b7a99]">{label}</p>
                    <p className="mt-1 text-base font-black text-[#172554]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e6ebf4] px-4 py-3">
                <span className="text-sm font-bold text-[#6b7a99]">Operational score</span>
                <span className="text-sm font-black text-[#10b981]">{mess.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    { name: 'Starter', price: '$99', description: 'Perfect for small messes', cta: 'Get Started', featured: false, features: ['Up to 50 residents', 'Basic meal planning', 'Billing system', 'Email support'] },
    { name: 'Professional', price: '$299', description: 'For growing messes', cta: 'Get Started', featured: true, badge: 'Most Popular', features: ['Up to 500 residents', 'Advanced meal planning', 'Full billing suite', 'Priority support', 'Analytics dashboard'] },
    { name: 'Enterprise', price: 'Custom', description: 'For large operations', cta: 'Contact Us', featured: false, features: ['Unlimited residents', 'Custom features', 'Dedicated support', 'API access', 'Custom integrations'] },
  ]
  return (
    <section id="pricing" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">Pricing</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-sm font-semibold text-[#6b7a99]">Plans that scale with your mess</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-xl border p-7 transition ${plan.featured ? 'border-[#a9ccfb] bg-gradient-to-b from-[#f8faff] to-white shadow-[0_18px_55px_rgba(47,128,237,0.18)]' : 'border-[#e6ebf4] bg-white hover:border-[#a9ccfb] hover:shadow-[0_12px_40px_rgba(47,128,237,0.08)]'}`}>
              {plan.badge && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 py-1 text-xs font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)]">{plan.badge}</span>}
              <h3 className="text-xl font-black text-[#172554]">{plan.name}</h3>
              <p className="mt-1 text-sm font-semibold text-[#6b7a99]">{plan.description}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight text-[#172554]">{plan.price}</span>
                <span className="pb-1 text-sm font-semibold text-[#6b7a99]">{plan.price === 'Custom' ? 'contact us' : '/month'}</span>
              </div>
              <Button asChild className={`mt-6 h-11 w-full rounded-xl font-black ${plan.featured ? 'bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]' : 'border border-[#e6ebf4] bg-white text-[#53617d] hover:bg-[#f8faff] hover:text-[#2f80ed]'}`} variant={plan.featured ? 'default' : 'outline'}><Link href="/register">{plan.cta}</Link></Button>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-semibold text-[#6b7a99]">
                    <CheckCircle2 size={15} className="shrink-0 text-[#2f80ed]" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyChooseSection() {
  const stats = [
    ['100+', 'Messes Trust Us', 'Managing thousands of residents daily'],
    ['99.9%', 'Uptime', 'Reliable platform you can depend on'],
    ['24/7', 'Support', 'Expert support whenever you need it'],
  ]
  return (
    <section className="bg-[#fafcff] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">Why Mess Management</span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Why Choose Mess Management?</h2>
        <p className="mt-4 text-sm font-semibold text-[#6b7a99]">Designed specifically for mess managers who value efficiency and transparency</p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {stats.map(([value, label, text]) => (
            <div key={label} className="rounded-xl border border-[#e6ebf4] bg-white p-8 shadow-[0_8px_25px_rgba(65,103,153,0.08)]">
              <p className="text-5xl font-black text-[#2f80ed]">{value}</p>
              <h3 className="mt-3 text-lg font-black text-[#172554]">{label}</h3>
              <p className="mt-2 text-sm font-semibold text-[#6b7a99]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#172554]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="overflow-hidden bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-2 text-xs font-black text-[#2f80ed]">
              <span className="flex h-2 w-2 rounded-full bg-[#10b981]" />
              All-in-One Mess Management Solution
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-[1.06] tracking-tight text-[#172554] sm:text-6xl">
              Manage Your Mess{' '}
              <span className="bg-gradient-to-r from-[#2f80ed] to-[#8b5cf6] bg-clip-text text-transparent">Smartly</span>{' '}
              & Easily
            </h1>
            <p className="mt-6 max-w-lg text-lg font-semibold leading-8 text-[#6b7a99]">
              A complete platform to manage meals, members, finances, shopping, attendance and everything in one place. Save time, reduce hassle, focus on what matters.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-7 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)]">
                <Link href="/register" className="flex items-center gap-2">Get Started Free <ArrowRight size={18} /></Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl border-[#e6ebf4] bg-white px-7 font-black text-[#2f80ed] hover:bg-[#f8faff] hover:border-[#a9ccfb]">
                <Link href="#features" className="flex items-center gap-2"><PlayCircle size={18} /> Explore Dashboard</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2.5">
                {['A', 'R', 'S', 'M'].map((name, index) => (
                  <span key={name} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#2f80ed] to-[#8b5cf6] text-sm font-black text-white shadow" style={{ zIndex: 4 - index }}>{name}</span>
                ))}
              </div>
              <div className="flex gap-0.5 text-[#ffb84d]">{'★★★★★'}</div>
              <p className="text-sm font-bold text-[#6b7a99]">from 2K+ happy users</p>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <SystemFeaturesSection />
      <TopMessSection />
      <PricingSection />
      <WhyChooseSection />
      <Footer />
    </main>
  )
}