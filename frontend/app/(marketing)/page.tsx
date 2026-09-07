'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  ReceiptText,
  Rocket,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { MarketingHero } from '@/components/marketing-hero'
import { MarketingStatsBar } from '@/components/marketing-stats'
import { SectionHeading } from '@/components/marketing-section'
import {
  AiWorkflowSection,
  AutomationCta,
  AutomationOverviewSection,
  BillingAndAlertsSection,
  DedicatedAppSection,
  MealPatternSection,
} from '@/components/automation-showcase'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { apiClient, type PublicMessCard } from '@/lib/api-client'
import { APP_FEATURES } from '@/lib/feature-flags'

const featureStrip = [
  { title: 'Meal Pattern Automation', text: 'Set once and let it keep running.', icon: CalendarDays, tone: 'text-[var(--brand)] bg-[var(--brand-soft)]' },
  { title: 'AI Voice & Text', text: 'Say the change and review it.', icon: Sparkles, tone: 'text-[var(--brand)] bg-[var(--brand-soft)]' },
  { title: 'Live Monthly Billing', text: 'Every update flows into the bill.', icon: ReceiptText, tone: 'text-[var(--brand)] bg-[var(--brand-soft)]' },
  { title: 'Smart Push Alerts', text: 'Meals, payments, and bazar reminders.', icon: BellRing, tone: 'text-[var(--brand)] bg-[var(--brand-soft)]' },
]

const detailedFeatures = [
  { title: 'Meals without guesswork', description: "Record breakfast, lunch, and dinner counts while keeping each member's meal history accurate.", icon: UtensilsCrossed },
  { title: 'Transparent shared costs', description: 'Add bazar and utility expenses with a clear trail that managers and members can trust.', icon: ShoppingBasket },
  { title: 'Bills that calculate themselves', description: 'Connect meal rates, deposits, expenses, and previous balances into reliable monthly bills.', icon: ReceiptText },
  { title: 'One connected community', description: 'Manage members, notices, requests, roles, and day-to-day communication from a single place.', icon: BellRing },
]

const steps = [
  { title: 'Create Your Mess', text: 'Add the community, members, and manager access.', icon: Building2 },
  { title: 'Set Meal Patterns', text: 'Create daily or weekly routines that keep running.', icon: CalendarDays },
  { title: 'Speak the Exceptions', text: 'Use AI for one-off meals, expenses, or deposits.', icon: Sparkles },
  { title: 'Stay on Autopilot', text: 'Bills recalculate and smart reminders go out.', icon: ReceiptText },
]

const demoMesses: PublicMessCard[] = [
  { id: 'demo-1', name: 'Mohakhali Premium Mess', address: 'Mohakhali, Dhaka', description: null, category: null, totalMembers: 42, totalSeats: 50, availableSeats: 8, totalMeals: 286, createdAt: '', creatorName: 'Admin', subscription: null },
  { id: 'demo-2', name: 'Banani Smart Residence', address: 'Banani, Dhaka', description: null, category: null, totalMembers: 36, totalSeats: 45, availableSeats: 9, totalMeals: 241, createdAt: '', creatorName: 'Admin', subscription: null },
  { id: 'demo-3', name: 'Dhanmondi Student Home', address: 'Dhanmondi, Dhaka', description: null, category: null, totalMembers: 58, totalSeats: 70, availableSeats: 12, totalMeals: 394, createdAt: '', creatorName: 'Admin', subscription: null },
  { id: 'demo-4', name: 'Uttara Elite Mess', address: 'Uttara, Dhaka', description: null, category: null, totalMembers: 28, totalSeats: 40, availableSeats: 12, totalMeals: 195, createdAt: '', creatorName: 'Admin', subscription: null },
]

interface PlanInfo {
  price: number
  label: string
  days: number
  description: string
  currency?: string
  features?: string[]
}

const fallbackPlans: Record<string, PlanInfo> = {
  TRIAL: { price: 0, label: 'Free Trial', days: 30, description: 'Explore Messzen with full access before you commit.' },
  MONTHLY: { price: 499, label: 'Monthly', days: 30, description: 'Flexible access for active mess communities.', currency: '৳' },
  YEARLY: { price: 4999, label: 'Yearly', days: 365, description: 'The best value for long-term mess management.', currency: '৳' },
}

function FeatureStrip() {
  return (
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="marketing-card marketing-container grid overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4">
        {featureStrip.map(({ title, text, icon: Icon, tone }, index) => (
          <article key={title} className={`flex items-center gap-4 p-5 sm:p-6 ${index ? 'border-t border-[var(--marketing-line)] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}>
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={21} /></span>
            <div><h2 className="text-sm font-semibold text-foreground">{title}</h2><p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{text}</p></div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CoreFeaturesSection() {
  return (
    <section id="features" className="marketing-section scroll-mt-24">
      <div className="marketing-container">
        <SectionHeading eyebrow="Everything stays connected" title="All the essentials behind the automation" description="The automated workflow is backed by dependable tools for meals, shared costs, billing, members, and communication." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {detailedFeatures.map(({ title, description, icon: Icon }) => (
            <article key={title} className="marketing-card marketing-card-hover rounded-2xl p-6">
              <span className="icon-tile"><Icon size={21} /></span>
              <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="marketing-section scroll-mt-24 bg-[var(--marketing-subtle)]/70">
      <div className="marketing-container">
        <SectionHeading title="How Messzen Works" description="Four simple steps take your mess from setup to a transparent monthly close." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ title, text, icon: Icon }, index) => (
            <article key={title} className="marketing-card relative rounded-2xl p-6">
              <span className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-lg bg-[var(--brand)] text-xs font-semibold text-white">{index + 1}</span>
              {index < steps.length - 1 && (
                <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-[var(--brand)] xl:block" size={18} />
              )}
              <span className="mx-auto mt-2 flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon size={25} />
              </span>
              <h3 className="mt-5 text-center text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-center text-sm font-medium leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function MessCard({ mess }: { mess: PublicMessCard }) {
  const isActive = mess.subscription?.status === 'ACTIVE'

  return (
    <article className="marketing-card marketing-card-hover flex h-full min-h-[245px] flex-col rounded-2xl bg-[var(--marketing-surface)] p-6">
      <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
        <Building2 size={19} />
      </span>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
        Mess community
      </p>
      <h3 className="mt-1.5 line-clamp-1 text-lg font-semibold tracking-tight text-foreground">
        {mess.name}
      </h3>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <MapPin size={13} className="shrink-0 text-[var(--brand)]" />
        <span className="truncate">{mess.address || 'Location not set'}</span>
      </p>
      <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">
        {mess.totalMembers} members, {mess.availableSeats} seats available and {mess.totalMeals} meals tracked with Messzen.
      </p>

      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
          <span className={`size-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[var(--brand-border)]'}`} />
          {isActive ? 'Active plan' : 'Managed on Messzen'}
        </span>
        <span className="max-w-28 truncate text-[11px] font-bold text-foreground">{mess.creatorName}</span>
      </div>
    </article>
  )
}

function MessesSection() {
  const [messes, setMesses] = useState<PublicMessCard[]>([])
  const [loading, setLoading] = useState(true)
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [selected, setSelected] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const visibleMesses = messes.length ? messes : demoMesses

  useEffect(() => {
    let active = true
    apiClient.getPublicMesses()
      .then((response) => {
        if (active && response?.data?.length) setMesses(response.data)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!api || !isVisible || visibleMesses.length < 2) return
    const sync = () => setSelected(api.selectedScrollSnap())
    sync()
    api.on('select', sync)
    const timer = window.setInterval(() => api.scrollNext(), 4500)
    return () => {
      api.off('select', sync)
      window.clearInterval(timer)
    }
  }, [api, isVisible, visibleMesses.length])

  return (
    <section ref={sectionRef} id="messes" className="marketing-section scroll-mt-24">
      <div className="marketing-container">
        <SectionHeading
          eyebrow="Growing communities"
          title="Messes managed with Messzen"
          description="Every community gets the same clear, consistent view of members, seats, meals, and subscription status."
        />
        <div className="relative mt-10 px-0 sm:px-10">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label="View previous mess"
            className="absolute -left-2 top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--marketing-surface)] text-[var(--brand)] transition-all duration-200 hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] active:scale-95 sm:flex"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          <Carousel setApi={setApi} opts={{ align: 'start', loop: true }}>
            <CarouselContent className="-ml-4">
              {(loading ? Array.from({ length: 4 }) : visibleMesses).map((item, index) => (
                <CarouselItem key={loading ? `loading-${index}` : (item as PublicMessCard).id} className="basis-full pl-4 sm:basis-1/2 xl:basis-1/3">
                  {loading ? (
                    <div className="marketing-card h-[270px] animate-pulse rounded-2xl bg-[var(--marketing-subtle)]" />
                  ) : (
                    <MessCard mess={item as PublicMessCard} />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label="View next mess"
            className="absolute -right-2 top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--marketing-surface)] text-[var(--brand)] transition-all duration-200 hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] active:scale-95 sm:flex"
          >
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>

          {!loading && (
            <div className="mt-7 flex items-center justify-center gap-4">
              <button type="button" onClick={() => api?.scrollPrev()} aria-label="View previous mess" className="flex size-10 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--marketing-surface)] text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white active:scale-95 sm:hidden">
                <ArrowLeft size={17} strokeWidth={2.5} />
              </button>
              <div className="flex gap-2">
                {visibleMesses.map((mess, index) => (
                  <button
                    key={mess.id}
                    type="button"
                    aria-label={`View ${mess.name}`}
                    onClick={() => api?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${selected === index ? 'w-7 bg-[var(--brand)]' : 'w-2 bg-[var(--brand-border-subtle)] hover:bg-[var(--brand-border)]'}`}
                  />
                ))}
              </div>
              <button type="button" onClick={() => api?.scrollNext()} aria-label="View next mess" className="flex size-10 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--marketing-surface)] text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white active:scale-95 sm:hidden">
                <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const [plans, setPlans] = useState<Record<string, PlanInfo>>(fallbackPlans)

  useEffect(() => {
    let active = true
    apiClient.getPublicPlans()
      .then((response) => {
        if (active && response?.data && Object.keys(response.data).length) setPlans(response.data)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  const orderedPlans = useMemo(
    () => ['TRIAL', 'MONTHLY', 'YEARLY'].filter((key) => plans[key]).map((key) => [key, plans[key]] as const),
    [plans],
  )

  return (
    <section id="pricing" className="marketing-section scroll-mt-24 bg-[var(--marketing-subtle)]/70">
      <div className="marketing-container">
        <SectionHeading title="Choose Your Plan" description="Simple pricing for every stage of your mess community." />
        <div className="mt-10 grid gap-5 md:grid-cols-3 xl:grid-cols-[repeat(3,1fr)_1.15fr]">
          {orderedPlans.map(([key, plan]) => {
            const featured = key === 'MONTHLY'
            const features = plan.features?.length ? plan.features : [
              'All core management tools',
              key === 'TRIAL' ? 'Full access for 30 days' : 'Unlimited mess activity',
              'Clear monthly calculations',
              key === 'YEARLY' ? 'Best long-term value' : 'Friendly support',
            ]
            return (
              <article key={key} className={`marketing-card relative flex min-h-[420px] flex-col rounded-2xl p-6 ${featured ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]/20' : ''}`}>
                {featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-semibold text-white">Most Popular</span>}
                <h3 className="text-lg font-semibold text-foreground">{plan.label}</h3>
                <div className="mt-3 flex items-end gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-semibold tracking-tight text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="pb-1 text-sm font-semibold text-muted-foreground">{plan.currency || '৳'}</span>
                      <span className="text-4xl font-semibold tracking-tight text-foreground">{plan.price.toLocaleString()}</span>
                      <span className="pb-1 text-xs font-medium text-muted-foreground">/{key === 'YEARLY' ? 'year' : 'month'}</span>
                    </>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {features.map((feature) => {
                    const label = feature.split('|')[0]?.trim()
                    return <li key={feature} className="flex gap-2.5 text-sm font-medium text-muted-foreground"><Check size={15} className="mt-0.5 shrink-0 text-[var(--brand)]" />{label}</li>
                  })}
                </ul>
                <Link href={key === 'TRIAL' ? '/register' : `/contact?source=subscription&plan=${key}`} className={featured ? 'brand-button mt-6' : 'ghost-button mt-6'}>
                  {key === 'TRIAL' ? 'Start Free' : 'Choose Plan'}
                </Link>
              </article>
            )
          })}

          <article className="relative min-h-[420px] overflow-hidden rounded-2xl bg-[var(--brand)] p-7 text-white md:col-span-3 xl:col-span-1">
            <Sparkles className="absolute right-6 top-6 text-white/60" />
            <h3 className="max-w-[12rem] text-2xl font-semibold leading-tight">Live better. Manage together.</h3>
            <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-white/80">Invite your members and give the whole community a more transparent way to live.</p>
            <Link href="/register" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">Create your mess <ArrowRight size={15} /></Link>
            <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/12 p-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-white text-[var(--brand-dark)]"><UsersRound size={23} /></span>
                <div><p className="text-sm font-semibold">One shared workspace</p><p className="mt-1 text-xs text-white/70">Managers and members stay aligned</p></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[CalendarDays, CreditCard, ShieldCheck].map((Icon, index) => <span key={index} className="flex h-12 items-center justify-center rounded-xl bg-black/10"><Icon size={18} /></span>)}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="marketing-section">
      <div className="marketing-container">
        <MarketingStatsBar />
        <div className="mt-10 overflow-hidden rounded-2xl bg-[var(--brand)] px-6 py-10 text-center text-white sm:px-10">
          <Rocket className="mx-auto" size={30} />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Ready for a calmer mess?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-white/80">Set up your community, invite your members, and keep every meal and taka accounted for.</p>
          <Link href="/register" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--brand-soft)]">
            Get Started for Free <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, isLoading, router])

  if (isAuthenticated) return null

  return (
    <main className="marketing-page">
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[var(--marketing-page)]">
          <div className="size-11 animate-spin rounded-full border-4 border-[var(--brand-soft)] border-t-[var(--brand)]" aria-label="Loading" />
        </div>
      )}
      <MarketingHero />
      <div className="marketing-container flex justify-center px-4 py-6 sm:px-6 lg:px-8">
        <a
          href="https://peerpush.com/p/messzen"
          target="_blank"
          rel="noopener"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://peerpush.com/p/messzen/badge.png"
            alt="Messzen on PeerPush"
            className="h-auto max-w-full"
            style={{ width: '230px' }}
          />
        </a>
      </div>
      <FeatureStrip />
      <AutomationOverviewSection />
      <AiWorkflowSection />
      <MealPatternSection />
      <DedicatedAppSection />
      <BillingAndAlertsSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <AutomationCta />
      <MessesSection />
      {APP_FEATURES.marketingPricing && <PricingSection />}
      <FinalCta />
    </main>
  )
}
