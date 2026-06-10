'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
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

function SystemFeaturesSection() {
  const features = [
    {
      icon: UtensilsCrossed,
      title: 'Meal Operations',
      text: 'Members can turn meals on or off, add guest meals, and managers can review the full daily meal sheet.',
      tone: 'bg-[#e7f1ff] text-[#005bbb]',
    },
    {
      icon: Users,
      title: 'Member & Role Control',
      text: 'Invite members, assign roles, manage active users, and keep every mess member organized from one place.',
      tone: 'bg-[#e9fff3] text-[#16a565]',
    },
    {
      icon: ShoppingCart,
      title: 'Bazar & Expense Tracking',
      text: 'Record daily bazar items, categorize expenses, and keep food costs transparent for the whole mess.',
      tone: 'bg-[#fff4df] text-[#d98a00]',
    },
    {
      icon: CreditCard,
      title: 'Payments & Monthly Bills',
      text: 'Generate monthly bills from meals, rent, utilities, deposits, and approved payments with less manual work.',
      tone: 'bg-[#fff0f0] text-[#ff4d4f]',
    },
    {
      icon: Bell,
      title: 'Notices & Requests',
      text: 'Publish important notices, manage complaints, and keep approvals clear for managers and members.',
      tone: 'bg-[#f0edff] text-[#6f3df4]',
    },
    {
      icon: BarChart3,
      title: 'Reports & Insights',
      text: 'Understand meals, dues, payments, and mess performance with clean summary dashboards and reports.',
      tone: 'bg-[#e8fbff] text-[#1492c8]',
    },
  ]

  return (
    <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005bbb]">System Features</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#07143d] sm:text-4xl">
            Professional tools for every mess workflow
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-[#667085]">
            MessFlow brings daily operations, member coordination, billing, shopping, and reporting into one clear
            management experience.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border border-[#dbe6f5] bg-white p-6 shadow-[0_16px_45px_rgba(45,88,139,0.08)] transition hover:-translate-y-1 hover:border-[#b7d5ff] hover:shadow-[0_22px_55px_rgba(47,128,237,0.14)]"
              >
                <div className="absolute right-5 top-5 text-5xl font-black text-[#eef5ff]">0{index + 1}</div>
                <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${feature.tone}`}>
                  <Icon size={22} />
                </span>
                <h3 className="relative mt-6 text-xl font-black text-[#07143d]">{feature.title}</h3>
                <p className="relative mt-3 text-sm font-medium leading-7 text-[#667085]">{feature.text}</p>
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
    {
      name: 'Mohakhali Premium Mess',
      area: 'Mohakhali, Dhaka',
      members: '42',
      meals: '286',
      due: '৳12k',
      accent: 'from-[#005bbb] to-[#2f80ed]',
    },
    {
      name: 'Banani Smart Residence',
      area: 'Banani, Dhaka',
      members: '36',
      meals: '241',
      due: '৳8k',
      accent: 'from-[#16a565] to-[#58d68d]',
    },
    {
      name: 'Dhanmondi Student Home',
      area: 'Dhanmondi, Dhaka',
      members: '58',
      meals: '394',
      due: '৳19k',
      accent: 'from-[#ff9f1c] to-[#ffb84d]',
    },
  ]

  return (
    <section className="bg-[#f4f8ff] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005bbb]">Top Mess Showcase</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#07143d] sm:text-4xl">
              Demo messes managed beautifully
            </h2>
          </div>
          <p className="max-w-xl text-sm font-medium leading-7 text-[#667085]">
            A quick preview of how different messes can monitor members, meals, dues, and daily operations with a
            consistent professional system.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {messes.map((mess, index) => (
            <div
              key={mess.name}
              className="relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_18px_55px_rgba(45,88,139,0.12)]"
            >
              <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${mess.accent}`} />
              <div className="flex items-start justify-between gap-4 pt-3">
                <div>
                  <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-black text-[#005bbb]">
                    Rank #{index + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-black text-[#07143d]">{mess.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">{mess.area}</p>
                </div>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${mess.accent} text-lg font-black text-white`}>
                  M
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['Members', mess.members],
                  ['Meals', mess.meals],
                  ['Due', mess.due],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f4f8ff] p-3 text-center">
                    <p className="text-xs font-bold text-[#667085]">{label}</p>
                    <p className="mt-1 text-lg font-black text-[#07143d]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e4eaf4] px-4 py-3">
                <span className="text-sm font-bold text-[#667085]">Operational score</span>
                <span className="text-sm font-black text-[#16a565]">{96 - index * 2}%</span>
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
    {
      name: 'Starter',
      price: '$99',
      description: 'Perfect for small messes',
      cta: 'Get Started',
      tone: 'border-border bg-white',
      features: ['Up to 50 residents', 'Basic meal planning', 'Billing system', 'Email support'],
    },
    {
      name: 'Professional',
      price: '$299',
      description: 'For growing messes',
      cta: 'Get Started',
      tone: 'border-[#2f80ed] bg-[#f0f7ff] shadow-[0_18px_45px_rgba(47,128,237,0.16)]',
      badge: 'Most Popular',
      features: ['Up to 500 residents', 'Advanced meal planning', 'Full billing suite', 'Priority support', 'Analytics dashboard'],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large operations',
      cta: 'Contact Us',
      tone: 'border-border bg-white',
      features: ['Unlimited residents', 'Custom features', 'Dedicated support', 'API access', 'Custom integrations'],
    },
  ]

  return (
    <section id="pricing" className="bg-white px-4 py-18 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-[#07143d] sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-base font-medium text-[#667085]">Plans that scale with your mess</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-xl border p-7 ${plan.tone}`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#d83a00] px-4 py-1 text-xs font-black text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-2xl font-black text-[#0a1433]">{plan.name}</h3>
              <p className="mt-2 text-sm font-medium text-[#667085]">{plan.description}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight text-[#0a1433]">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="pb-1 text-sm font-medium text-[#667085]">per month</span>}
                {plan.price === 'Custom' && <span className="pb-1 text-sm font-medium text-[#667085]">contact us</span>}
              </div>
              <Button
                className={`mt-6 h-11 w-full rounded-lg font-black ${
                  plan.badge ? 'bg-[#005bbb] text-white hover:bg-[#004fa3]' : 'border border-border bg-white text-[#0a1433] hover:bg-[#f4f8ff]'
                }`}
                variant={plan.badge ? 'default' : 'outline'}
              >
                {plan.cta}
              </Button>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-medium text-[#0a1433]">
                    <CheckCircle2 size={15} className="text-[#d83a00]" />
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
    <section id="about" className="bg-[#dcebff] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-black tracking-tight text-[#07143d] sm:text-4xl">Why Choose MessFlow?</h2>
        <p className="mt-4 text-base font-medium text-[#667085]">
          Designed specifically for mess managers who value efficiency and transparency
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {stats.map(([value, label, text]) => (
            <div key={label}>
              <p className="text-4xl font-black text-[#005bbb]">{value}</p>
              <h3 className="mt-3 text-lg font-black text-[#07143d]">{label}</h3>
              <p className="mt-3 text-sm font-medium text-[#667085]">{text}</p>
            </div>
          ))}
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
                <Link href="#features">Explore Dashboard <PlayCircle size={18} className="ml-2" /></Link>
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

      <SystemFeaturesSection />
      <TopMessSection />
      <PricingSection />
      <WhyChooseSection />
      <Footer />
    </main>
  )
}
