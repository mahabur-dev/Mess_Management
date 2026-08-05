'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  WalletCards,
  Star,
  Shield,
  Building2,
  Zap,
  Sparkles,
  Clock,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { apiClient, type PublicMessCard } from '@/lib/api-client'
import { MarketingHero } from '@/components/marketing-hero'
import { MarketingStatsBar } from '@/components/marketing-stats'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'


function SystemFeaturesSection() {
  const features = [
    {
      title: 'Smart Meal Suggestions',
      description: 'Daily meal, attendance, and bazar entries stay organized with guided actions.',
      tone: 'from-[#fff2b8] via-[#fff9dc] to-[#eef9f7]',
      visual: 'meal',
    },
    {
      title: 'Automated Bill Engine',
      description: 'Meals, deposits, utilities, and expenses connect into clear monthly bills.',
      tone: 'from-[#ffdce9] via-[#fff0d8] to-[#edf8f6]',
      visual: 'billing',
    },
    {
      title: 'Member Library',
      description: 'Find residents, roles, dues, requests, and notifications from one simple hub.',
      tone: 'from-[#ffe4f0] via-[#f1ddff] to-[#eef9f7]',
      visual: 'members',
    },
  ]

  return (
    <section id="features" className="overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b8b530]">System Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#073735] sm:text-4xl">
            Built for Speed & Quality
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-[#526b6a]">
            Everything needed to run a modern mess from meal count to monthly bill.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group overflow-hidden rounded-lg border border-[#e8f0ef] bg-[#f7fbfb] shadow-[0_18px_46px_rgba(11,90,95,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(11,90,95,0.12)]"
            >
              <div className={`relative h-[220px] overflow-hidden bg-gradient-to-br ${feature.tone}`}>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.26)_1px,transparent_1px)] bg-[size:22px_22px]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f7fbfb] to-transparent" />

                {feature.visual === 'meal' && (
                  <div className="absolute left-8 top-8 w-[190px] rounded-lg border border-white/80 bg-white/88 p-4 shadow-[0_18px_42px_rgba(7,55,53,0.12)] backdrop-blur">
                    <p className="text-xs font-semibold leading-5 text-[#073735]">
                      Add lunch, dinner, and bazar cost for today in one flow.
                    </p>
                    <div className="mt-4 inline-flex h-8 items-center gap-2 rounded-full border border-[#d8e8e7] bg-white px-3 text-[11px] font-black text-[#073735] shadow-sm">
                      <UtensilsCrossed size={13} className="text-[#ff6464]" />
                      Add meal
                    </div>
                    <div className="absolute -bottom-8 left-16 h-0 w-0 rotate-[-18deg] border-l-[13px] border-r-[13px] border-t-[28px] border-l-transparent border-r-transparent border-t-[#073735]" />
                  </div>
                )}

                {feature.visual === 'billing' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/70 shadow-[0_22px_46px_rgba(255,126,86,0.22)] ring-1 ring-white/80">
                      <div className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-[#ffb84d] to-[#ff7d63] blur-sm opacity-75" />
                      <WalletCards size={34} className="relative text-white drop-shadow" />
                    </div>
                    <div className="absolute left-[52%] top-[50px] hidden w-[120px] border-t border-white/80 sm:block" />
                    <div className="absolute left-[60%] top-[38px] space-y-3">
                      {[
                        { label: 'Meals', icon: UtensilsCrossed, muted: false },
                        { label: 'Expenses', icon: ShoppingCart, muted: false },
                        { label: 'Deposits', icon: CreditCard, muted: true },
                      ].map(({ label, icon: Icon, muted }) => (
                        <div
                          key={label}
                          className={`flex h-8 w-28 items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 text-[10px] font-black text-[#073735] shadow-sm backdrop-blur ${muted ? 'opacity-55' : ''}`}
                        >
                          <Icon size={12} className={muted ? 'text-[#9aa8a6]' : 'text-[#008b80]'} />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {feature.visual === 'members' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-24 w-28 items-center justify-center rounded-lg bg-white/88 shadow-[0_22px_46px_rgba(134,79,170,0.16)]">
                      <div className="absolute -top-4 left-4 h-7 w-16 rounded-t-lg bg-white/78" />
                      <Users size={46} className="relative text-white drop-shadow-[0_8px_18px_rgba(7,55,53,0.12)]" />
                    </div>
                    <div className="absolute bottom-14 left-1/2 flex h-8 -translate-x-1/2 items-center gap-2 rounded-full border border-[#d8e8e7] bg-white px-3 text-[10px] font-black text-[#073735] shadow-sm">
                      <BarChart3 size={12} className="text-[#008b80]" />
                      Search members
                    </div>
                    <div className="absolute right-7 top-9 space-y-2">
                      {[Bell, ClipboardList].map((Icon, index) => (
                        <div key={index} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#008b80] shadow-sm ring-1 ring-white/80">
                          <Icon size={15} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 pt-1">
                <h3 className="text-sm font-black text-[#073735]">{feature.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#526b6a]">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>

        {/* App Download CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#073735] to-[#006b63] px-6 py-8 sm:px-8 lg:flex-row lg:px-10">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#25d7c8]">
              Android App
            </p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
              Get the Mess Management app on your phone
            </h3>
            <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-white/78">
              Install the Android app and run your mess from anywhere — meals, bills, members, and bazar in one place.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2.5 sm:flex-row sm:gap-4">
            <a
              href="/app-debug.apk"
              download="mess-management-app.apk"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-white px-7 font-black text-[#006b63] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:bg-[#f0f6ff]"
            >
              <Download size={16} />
              Download App
            </a>
            <span className="text-xs font-bold text-[#cffffb]/80">Android · ~4.6 MB</span>
          </div>
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
    { gradient: 'from-[#008b80] to-[#00a99d]', badge: 'bg-[#e7f7f5] text-[#008b80]', iconBg: 'bg-gradient-to-br from-[#008b80] to-[#00a99d]' },
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
          <span className="inline-flex items-center rounded-full border border-[#d8e8e7] bg-[#fbfdfd] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#008b80]">Our Partner Messes</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#071821] sm:text-4xl">
            {loading ? 'Exploring messes...' : 'Discover Active Messes'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-[#334155] max-w-2xl mx-auto">
            Browse through our featured messes — each one managed efficiently with our platform.
          </p>
          {!loading && messes.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e7f7f5] px-3 py-1 text-xs font-bold text-[#008b80]">
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
                              <h3 className="text-lg font-black text-[#071821] leading-tight truncate">{mess.name}</h3>
                              <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-[#334155]">
                                <Building2 size={11} />
                                <span className="truncate">{mess.address || 'Location not set'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="mt-4 grid grid-cols-3 gap-2.5">
                            {[
                              { label: 'Members', value: mess.totalMembers.toString(), color: 'text-[#008b80]' },
                              { label: 'Seats', value: mess.availableSeats > 0 ? `${mess.availableSeats} free` : 'Full', color: mess.availableSeats > 0 ? 'text-[#10b981]' : 'text-[#ef4444]' },
                              { label: 'Meals (Today)', value: mess.totalMeals.toString(), color: 'text-[#f59e0b]' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="rounded-xl bg-[#fbfdfd] px-2.5 py-3 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#64748b]">{label}</p>
                                <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Subscription Status */}
                          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#fbfdfd] to-white border border-[#e6ebf4] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${mess.subscription?.status === 'ACTIVE' ? 'bg-[#10b981]' : 'bg-[#d8e8e7]'}`} />
                              <span className="text-xs font-bold text-[#334155]">
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
                            <span className="text-xs font-bold text-[#64748b]">Managed by</span>
                            <span className="text-sm font-black text-[#071821] truncate max-w-[140px]">{mess.creatorName}</span>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  )
                })
              )}
            </CarouselContent>

            {/* Navigation buttons */}
            <CarouselPrevious className="hidden sm:flex -left-1 sm:-left-3 size-11 rounded-full border-2 border-[#d8e8e7] bg-white text-[#008b80] shadow-lg hover:bg-[#e7f7f5] hover:border-[#9edbd6] hover:text-[#071821]" />
            <CarouselNext className="hidden sm:flex -right-1 sm:-right-3 size-11 rounded-full border-2 border-[#d8e8e7] bg-white text-[#008b80] shadow-lg hover:bg-[#e7f7f5] hover:border-[#9edbd6] hover:text-[#071821]" />
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
                    : 'h-2.5 w-2.5 bg-[#d8e8e7] hover:bg-[#9edbd6]'
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
    TRIAL: { bg: 'bg-white', border: 'border-[#e6ebf4]', badge: 'from-[#334155] to-[#8895a8]', btn: 'border-[#e6ebf4] bg-white text-[#53617d] hover:bg-[#fbfdfd] hover:text-[#008b80]' },
    MONTHLY: { bg: 'bg-gradient-to-b from-[#fbfdfd] to-white', border: 'border-[#9edbd6]', badge: 'from-[#008b80] to-[#00a99d]', btn: 'bg-gradient-to-r from-[#008b80] to-[#00a99d] text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]' },
    YEARLY: { bg: 'bg-white', border: 'border-[#e6ebf4] hover:border-[#ffb84d]', badge: 'from-[#f59e0b] to-[#f97316]', btn: 'border border-[#e6ebf4] bg-white text-[#53617d] hover:bg-[#fbfdfd] hover:text-[#f59e0b]' },
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
          <span className="inline-flex items-center rounded-full border border-[#d8e8e7] bg-[#fbfdfd] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#008b80]">Subscription Plans</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#071821] sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-sm font-semibold text-[#334155]">Choose the plan that fits your mess best. Start with a free 30-day trial.</p>
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
                      : `${colors.bg} ${colors.border} hover:${colors.border.includes('a9ccfb') ? 'border-[#9edbd6]' : colors.border.includes('ffb84d') ? 'border-[#ffb84d]' : '#9edbd6'} hover:shadow-[0_12px_40px_rgba(47,128,237,0.08)]`
                  }`}
                >
                  {/* Badge */}
                  {isMonthly && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#008b80] to-[#00a99d] px-4 py-1 text-xs font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)] flex items-center gap-1">
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
                      isMonthly ? 'bg-[#e7f7f5] text-[#008b80]' : isYearly ? 'bg-[#fffbeb] text-[#f59e0b]' : 'bg-[#f0f6ff] text-[#334155]'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#071821]">{plan.label}</h3>
                      <p className="text-xs font-semibold text-[#334155]">
                        {isTrial ? 'No commitment needed' : `${plan.days} days subscription`}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-6 flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-black tracking-tight text-[#071821]">Free</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-[#334155] mb-1">{plan.currency || '৳'}</span>
                        <span className="text-4xl font-black tracking-tight text-[#071821]">{plan.price.toLocaleString()}</span>
                        <span className="pb-1 text-sm font-semibold text-[#334155]">
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

                  <p className="mt-4 text-sm font-semibold leading-6 text-[#334155]">{plan.description}</p>

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
                      isTrial ? '30 days full access' : 'Unlimited members',
                      isTrial ? 'No payment needed' : 'Priority support',
                      isTrial ? 'Cancel anytime' : isYearly ? 'Best savings' : 'Flexible monthly',
                    ]).map((feature: string) => {
                      const parts = feature.split('|')
                      const title = parts[0]?.trim() ?? feature
                      const desc = parts[1]?.trim()
                      return (
                        <div key={title} className="group relative flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#008b80]" />
                          <div>
                            <p className="text-sm font-bold text-[#334155]">{title}</p>
                            {desc && (
                              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-[#64748b]">{desc}</p>
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
          <div className="mt-12 rounded-2xl border border-dashed border-[#d8e8e7] bg-[#fafcff] px-6 py-16 text-center">
            <p className="text-lg font-black text-[#071821]">Pricing data is unavailable</p>
            <p className="mt-2 text-sm font-semibold text-[#334155]">
              The backend did not return any subscription plans yet.
            </p>
          </div>
        )}

        {/* Bottom note */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#e6ebf4] bg-[#fafcff] px-5 py-3">
            <Shield size={16} className="text-[#10b981]" />
            <span className="text-xs font-bold text-[#334155]">
              All plans include a 30-day free trial. No hidden fees. Cancel anytime.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyChooseSection() {
  return (
    <section id="about" className="bg-[#fafcff] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-flex items-center rounded-full border border-[#d8e8e7] bg-[#fbfdfd] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#008b80]">Why Mess Management</span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#071821] sm:text-4xl">Why Choose Mess Management?</h2>
        <p className="mt-4 text-sm font-semibold text-[#334155]">Designed specifically for mess managers who value efficiency and transparency</p>
        <MarketingStatsBar className="mt-14" />
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
          <div className="w-12 h-12 rounded-full border-4 border-[#e6ebf4] border-t-[#008b80] animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[#334155]">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-white text-[#071821]">
      <MarketingHero />

      <SystemFeaturesSection />
      <TopMessSection />
      <PricingSection />
      <WhyChooseSection />
    </main>
  )
}
