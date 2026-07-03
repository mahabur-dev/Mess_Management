'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
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
  Building2,
  Zap,
  Infinity,
  Sparkles,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useState, useRef } from 'react'
import { apiClient, type PublicMessCard } from '@/lib/api-client'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'

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

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function TopMessSection() {
  const [messes, setMesses] = useState<PublicMessCard[]>([])
  const [loading, setLoading] = useState(true)
  const [api, setApi] = useState<CarouselApi | null>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoplay = () => {
    stopAutoplay()
    autoplayRef.current = setInterval(() => {
      api?.scrollNext()
    }, 4000)
  }

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }
  }

  useEffect(() => {
    async function fetchMesses() {
      try {
        const res = await apiClient.getPublicMesses()
        if (res?.data) setMesses(res.data)
      } catch (err) {
        console.error('Failed to fetch messes:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMesses()
  }, [])

  useEffect(() => {
    if (!api) return
    startAutoplay()
    return () => stopAutoplay()
  }, [api, messes])

  const cardAccents = [
    { gradient: 'from-[#2f80ed] to-[#3b8cff]', badge: 'bg-[#eef5ff] text-[#2f80ed]', iconBg: 'bg-gradient-to-br from-[#2f80ed] to-[#3b8cff]' },
    { gradient: 'from-[#10b981] to-[#34d399]', badge: 'bg-[#ecfdf5] text-[#10b981]', iconBg: 'bg-gradient-to-br from-[#10b981] to-[#34d399]' },
    { gradient: 'from-[#f59e0b] to-[#f97316]', badge: 'bg-[#fffbeb] text-[#f59e0b]', iconBg: 'bg-gradient-to-br from-[#f59e0b] to-[#f97316]' },
    { gradient: 'from-[#6d28d9] to-[#8b5cf6]', badge: 'bg-[#f5f3ff] text-[#6d28d9]', iconBg: 'bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6]' },
    { gradient: 'from-[#0ea5e9] to-[#2563eb]', badge: 'bg-[#ecfeff] text-[#0ea5e9]', iconBg: 'bg-gradient-to-br from-[#0ea5e9] to-[#2563eb]' },
    { gradient: 'from-[#ef4444] to-[#f43f5e]', badge: 'bg-[#fef2f2] text-[#ef4444]', iconBg: 'bg-gradient-to-br from-[#ef4444] to-[#f43f5e]' },
  ]

  const subscriptionStyles = {
    TRIAL: { label: 'Trial', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    MONTHLY: { label: 'Monthly', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    YEARLY: { label: 'Yearly', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  } as const

  const demoMesses: PublicMessCard[] = messes.length > 0 ? messes : [
    { id: '1', name: 'Mohakhali Premium Mess', address: 'Mohakhali, Dhaka', description: null, category: null, totalMembers: 42, totalSeats: 50, availableSeats: 8, totalMeals: 286, createdAt: '', creatorName: 'Admin', subscription: null },
    { id: '2', name: 'Banani Smart Residence', address: 'Banani, Dhaka', description: null, category: null, totalMembers: 36, totalSeats: 45, availableSeats: 9, totalMeals: 241, createdAt: '', creatorName: 'Admin', subscription: null },
    { id: '3', name: 'Dhanmondi Student Home', address: 'Dhanmondi, Dhaka', description: null, category: null, totalMembers: 58, totalSeats: 70, availableSeats: 12, totalMeals: 394, createdAt: '', creatorName: 'Admin', subscription: null },
    { id: '4', name: 'Uttara Elite Mess', address: 'Uttara, Dhaka', description: null, category: null, totalMembers: 28, totalSeats: 40, availableSeats: 12, totalMeals: 195, createdAt: '', creatorName: 'Admin', subscription: null },
    { id: '5', name: 'Mirpur Harmony Living', address: 'Mirpur, Dhaka', description: null, category: null, totalMembers: 45, totalSeats: 55, availableSeats: 10, totalMeals: 312, createdAt: '', creatorName: 'Admin', subscription: null },
    { id: '6', name: 'Gulshan Premium Suite', address: 'Gulshan, Dhaka', description: null, category: null, totalMembers: 22, totalSeats: 30, availableSeats: 8, totalMeals: 178, createdAt: '', creatorName: 'Admin', subscription: null },
  ]

  return (
    <section id="messes" className="overflow-hidden bg-gradient-to-b from-[#fafcff] to-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">Our Partner Messes</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">
            {loading ? 'Exploring messes...' : 'Discover Active Messes'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-[#6b7a99] max-w-2xl mx-auto">
            Browse through our featured messes — each one managed efficiently with our platform.
          </p>
          {!loading && messes.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-bold text-[#2f80ed]">
              <Building2 size={12} />
              {messes.length} mess{messes.length > 1 ? 'es' : ''} actively using Mess Management
            </p>
          )}
        </div>

        <div className="relative mt-12 px-0 sm:px-12">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: true,
              skipSnaps: false,
              slidesToScroll: 1,
              breakpoints: { '(min-width: 1024px)': { slidesToScroll: 1 } },
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CarouselItem key={i} className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <div className="animate-pulse rounded-2xl border border-[#e6ebf4] bg-white p-5">
                      <div className="h-2 w-16 rounded-full bg-[#e6ebf4] mb-4" />
                      <div className="h-5 w-3/4 rounded-full bg-[#e6ebf4] mb-2" />
                      <div className="h-4 w-1/2 rounded-full bg-[#e6ebf4] mb-5" />
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="rounded-xl bg-[#f0f6ff] p-3 h-16" />
                        ))}
                      </div>
                      <div className="h-20 rounded-xl bg-[#f0f6ff]" />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                demoMesses.map((mess, index) => {
                  const accent = cardAccents[index % cardAccents.length]
                  const letters = mess.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <CarouselItem key={mess.id} className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <div className="group relative h-full overflow-hidden rounded-2xl border border-[#e6ebf4] bg-white shadow-[0_4px_20px_rgba(65,103,153,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(47,128,237,0.14)]">
                        {/* Gradient top bar */}
                        <div className={`h-2 w-full bg-gradient-to-r ${accent.gradient}`} />

                        <div className="p-5">
                          {/* Header with Avatar */}
                          <div className="flex items-center gap-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent.iconBg} text-lg font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.2)]`}>
                              {letters || 'M'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-black text-[#172554] leading-tight truncate">{mess.name}</h3>
                              <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-[#6b7a99]">
                                <Building2 size={11} />
                                <span className="truncate">{mess.address || 'Location not set'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="mt-4 grid grid-cols-3 gap-2.5">
                            {[
                              { label: 'Members', value: mess.totalMembers.toString(), color: 'text-[#2f80ed]' },
                              { label: 'Seats', value: mess.availableSeats > 0 ? `${mess.availableSeats} free` : 'Full', color: mess.availableSeats > 0 ? 'text-[#10b981]' : 'text-[#ef4444]' },
                              { label: 'Meals (Today)', value: mess.totalMeals.toString(), color: 'text-[#f59e0b]' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="rounded-xl bg-[#f8faff] px-2.5 py-3 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a9bb5]">{label}</p>
                                <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Subscription Status */}
                          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#f8faff] to-white border border-[#e6ebf4] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${mess.subscription?.status === 'ACTIVE' ? 'bg-[#10b981]' : 'bg-[#d8e6f8]'}`} />
                              <span className="text-xs font-bold text-[#6b7a99]">
                                {mess.subscription ? (
                                  mess.subscription.status === 'ACTIVE' ? 'Active Subscription' : mess.subscription.status
                                ) : 'No Subscription'}
                              </span>
                            </div>
                            {mess.subscription && (
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${subscriptionStyles[mess.subscription.plan].bg} ${subscriptionStyles[mess.subscription.plan].text} ${subscriptionStyles[mess.subscription.plan].border}`}>
                                {subscriptionStyles[mess.subscription.plan].label}
                              </span>
                            )}
                          </div>

                          {/* Manager */}
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fafcff] px-4 py-2.5">
                            <span className="text-xs font-bold text-[#8a9bb5]">Managed by</span>
                            <span className="text-sm font-black text-[#172554] truncate max-w-[140px]">{mess.creatorName}</span>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  )
                })
              )}
            </CarouselContent>

            {/* Navigation buttons */}
            <CarouselPrevious className="hidden sm:flex -left-1 sm:-left-3 size-11 rounded-full border-2 border-[#d8e6f8] bg-white text-[#2f80ed] shadow-lg hover:bg-[#eef5ff] hover:border-[#a9ccfb] hover:text-[#172554]" />
            <CarouselNext className="hidden sm:flex -right-1 sm:-right-3 size-11 rounded-full border-2 border-[#d8e6f8] bg-white text-[#2f80ed] shadow-lg hover:bg-[#eef5ff] hover:border-[#a9ccfb] hover:text-[#172554]" />
          </Carousel>

          {/* Dots indicator */}
          <div className="mt-8 flex items-center justify-center gap-2.5">
            {demoMesses.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  api?.selectedScrollSnap() === i
                    ? `h-2.5 w-8 bg-gradient-to-r ${cardAccents[i % cardAccents.length].gradient} shadow-sm`
                    : 'h-2.5 w-2.5 bg-[#d8e6f8] hover:bg-[#a9ccfb]'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface PlanInfo {
  price: number
  label: string
  days: number
  description: string
  currency?: string
  features?: string[]
}

function PricingSection() {
  const [plans, setPlans] = useState<Record<string, PlanInfo> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await apiClient.getPublicPlans();
        if (res?.data) setPlans(res.data)
        console.log(res)
      } catch (err) {
        console.error('Failed to fetch plans:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const defaultPlans: Record<string, PlanInfo> = {
    TRIAL: { price: 0, label: '30 Days Free', days: 30, description: 'Get started with a free trial. No credit card required.' },
    MONTHLY: { price: 499, label: '1 Month', days: 30, description: 'Perfect for active messes needing full features monthly.', currency: '৳' },
    YEARLY: { price: 4999, label: '1 Year', days: 365, description: 'Best value for long-term mess management. Save big!', currency: '৳' },
  }

  const activePlans = plans ?? {}
  const planEntries = Object.entries(activePlans)

  const planIcons: Record<string, typeof Zap> = {
    TRIAL: Clock,
    MONTHLY: Zap,
    YEARLY: Sparkles,
  }

  const planColors: Record<string, { bg: string; border: string; badge: string; btn: string }> = {
    TRIAL: { bg: 'bg-white', border: 'border-[#e6ebf4]', badge: 'from-[#6b7a99] to-[#8895a8]', btn: 'border-[#e6ebf4] bg-white text-[#53617d] hover:bg-[#f8faff] hover:text-[#2f80ed]' },
    MONTHLY: { bg: 'bg-gradient-to-b from-[#f8faff] to-white', border: 'border-[#a9ccfb]', badge: 'from-[#2f80ed] to-[#3b8cff]', btn: 'bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]' },
    YEARLY: { bg: 'bg-white', border: 'border-[#e6ebf4] hover:border-[#ffb84d]', badge: 'from-[#f59e0b] to-[#f97316]', btn: 'border border-[#e6ebf4] bg-white text-[#53617d] hover:bg-[#f8faff] hover:text-[#f59e0b]' },
  }

  // Calculate savings
  const monthlyPrice = Number(activePlans.MONTHLY?.price ?? 0)
  const yearlyPrice = Number(activePlans.YEARLY?.price ?? 0)
  const yearlyRegular = monthlyPrice * 12
  const savings = Math.max(yearlyRegular - yearlyPrice, 0)
  const savingsPercent = yearlyRegular > 0 ? Math.round((savings / yearlyRegular) * 100) : 0

  return (
    <section id="pricing" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">Subscription Plans</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-sm font-semibold text-[#6b7a99]">Choose the plan that fits your mess best. Start with a free 7-day trial.</p>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="animate-pulse flex gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] w-[300px] rounded-xl bg-[#f0f6ff]" />
              ))}
            </div>
          </div>
        ) : planEntries.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {planEntries.map(([key, plan]) => {
              const icons = planIcons
              const Icon = icons[key as keyof typeof icons] || Zap
              const colors = planColors[key as keyof typeof planColors] || planColors.MONTHLY
              const isMonthly = key === 'MONTHLY'
              const isYearly = key === 'YEARLY'
              const isTrial = key === 'TRIAL'

              return (
                <div
                  key={key}
                  className={`relative rounded-xl border p-7 transition ${
                    isMonthly
                      ? `${colors.bg} ${colors.border} shadow-[0_18px_55px_rgba(47,128,237,0.18)] scale-[1.02]`
                      : `${colors.bg} ${colors.border} hover:${colors.border.includes('a9ccfb') ? 'border-[#a9ccfb]' : colors.border.includes('ffb84d') ? 'border-[#ffb84d]' : '#a9ccfb'} hover:shadow-[0_12px_40px_rgba(47,128,237,0.08)]`
                  }`}
                >
                  {/* Badge */}
                  {isMonthly && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 py-1 text-xs font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)] flex items-center gap-1">
                      <Star size={12} /> Most Popular
                    </span>
                  )}
                  {isYearly && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 py-1 text-xs font-black text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] flex items-center gap-1">
                      <Sparkles size={12} /> Best Value
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isMonthly ? 'bg-[#e7f1ff] text-[#2f80ed]' : isYearly ? 'bg-[#fffbeb] text-[#f59e0b]' : 'bg-[#f0f6ff] text-[#6b7a99]'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#172554]">{plan.label}</h3>
                      <p className="text-xs font-semibold text-[#6b7a99]">
                        {isTrial ? 'No commitment needed' : `${plan.days} days subscription`}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-6 flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-black tracking-tight text-[#172554]">Free</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-[#6b7a99] mb-1">{plan.currency || '৳'}</span>
                        <span className="text-4xl font-black tracking-tight text-[#172554]">{plan.price.toLocaleString()}</span>
                        <span className="pb-1 text-sm font-semibold text-[#6b7a99]">
                          {isYearly ? '/year' : '/month'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Savings for yearly */}
                  {isYearly && (
                    <div className="mt-2 rounded-lg bg-[#fffbeb] px-3 py-2 text-center">
                      <p className="text-xs font-black text-[#f59e0b]">
                        Save ৳{savings.toLocaleString()} ({savingsPercent}% off) vs monthly
                      </p>
                    </div>
                  )}

                  <p className="mt-4 text-sm font-semibold leading-6 text-[#6b7a99]">{plan.description}</p>

                  {/* CTA Button */}
                  <Button
                    asChild
                    className={`mt-6 h-11 w-full rounded-xl font-black ${
                      isMonthly ? colors.btn : colors.btn
                    }`}
                    variant={isMonthly ? 'default' : 'outline'}
                  >
                    <Link href={isTrial ? '/register' : `/contact?source=subscription&plan=${key}`}>
                      {isTrial ? 'Start Free Trial' : isMonthly ? 'Subscribe Now' : 'Get Yearly Plan'}
                    </Link>
                  </Button>

                  {/* Features */}
                  <div className="mt-6 space-y-2.5">
                    {(plan.features?.length ? plan.features : [
                      'All features included',
                      isTrial ? '7 days full access' : 'Unlimited members',
                      isTrial ? 'No payment needed' : 'Priority support',
                      isTrial ? 'Cancel anytime' : isYearly ? 'Best savings' : 'Flexible monthly',
                    ]).map((feature: string) => {
                      const parts = feature.split('|')
                      const title = parts[0]?.trim() ?? feature
                      const desc = parts[1]?.trim()
                      return (
                        <div key={title} className="group relative flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2f80ed]" />
                          <div>
                            <p className="text-sm font-bold text-[#172554]">{title}</p>
                            {desc && (
                              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-[#8a9bb5]">{desc}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-[#d8e6f8] bg-[#fafcff] px-6 py-16 text-center">
            <p className="text-lg font-black text-[#172554]">Pricing data is unavailable</p>
            <p className="mt-2 text-sm font-semibold text-[#6b7a99]">
              The backend did not return any subscription plans yet.
            </p>
          </div>
        )}

        {/* Bottom note */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#e6ebf4] bg-[#fafcff] px-5 py-3">
            <Shield size={16} className="text-[#10b981]" />
            <span className="text-xs font-bold text-[#6b7a99]">
              All plans include a 7-day free trial. No hidden fees. Cancel anytime.
            </span>
          </div>
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
    <section id="about" className="bg-[#fafcff] px-4 py-20 sm:px-6 lg:px-8">
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
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#e6ebf4] border-t-[#2f80ed] animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[#6b7a99]">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

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
            {/* <h1 className="max-w-xl text-5xl font-black leading-[1.06] tracking-tight text-[#172554] sm:text-6xl">
              Manage Your Mess{' '}
              <span className="bg-gradient-to-r from-[#2f80ed] to-[#8b5cf6] bg-clip-text text-transparent">Smartly</span>{' '}
              & Easily
            </h1> */}

            <h1 className="max-w-4xl text-3xl font-black leading-[1.06] tracking-tight text-[#172554] sm:text-3xl">
              Run Your{" "}
              <span className="bg-gradient-to-r from-[#2f80ed] to-[#8b5cf6] bg-clip-text text-transparent">
                Hostel & Mess
              </span>{" "}
              Smarter with Complete Automation
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Automate meal tracking, room management, expenses,
              resident communication, and financial reports—all from one powerful platform.
            </p>
            {/* <p className="mt-6 max-w-lg text-lg font-semibold leading-8 text-[#6b7a99]">
              A complete platform to manage meals, members, finances, shopping, attendance and everything in one place. Save time, reduce hassle, focus on what matters.
            </p> */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-7 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)]">
                <Link href="/register" className="flex items-center gap-2">Get Started Free <ArrowRight size={18} /></Link>
              </Button>
              {/* <Button asChild variant="outline" className="h-12 rounded-xl border-[#e6ebf4] bg-white px-7 font-black text-[#2f80ed] hover:bg-[#f8faff] hover:border-[#a9ccfb]">
                <Link href="#features" className="flex items-center gap-2"><PlayCircle size={18} /> Explore Dashboard</Link>
              </Button> */}
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
