import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  Bot,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mic2,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  WalletCards,
  WandSparkles,
} from 'lucide-react'
import { AppScreenshot } from '@/components/app-screenshot'
import { MarketingMobileAppTour } from '@/components/marketing-mobile-app-tour'
import { SectionHeading } from '@/components/marketing-section'

const automationModes = [
  {
    eyebrow: 'Recurring automation',
    title: 'Set a meal pattern once',
    text: 'Create a daily or weekly routine for each member. Messzen keeps adding meals automatically until the pattern changes.',
    icon: RefreshCw,
    bullets: ['No daily meal entry', 'Member-specific schedules', 'Runs continuously'],
  },
  {
    eyebrow: 'AI-assisted changes',
    title: 'Speak or type the exception',
    text: 'For deposits, expenses, utilities, or one-off meal changes, use a natural voice or text command and review before saving.',
    icon: WandSparkles,
    bullets: ['Bangla, English & Banglish', 'Preview before confirm', 'Records update together'],
  },
]

const weeklyPattern = [
  { day: 'Mon', meals: ['B', 'L', 'D'] },
  { day: 'Tue', meals: ['L', 'D'] },
  { day: 'Wed', meals: ['B', 'L', 'D'] },
  { day: 'Thu', meals: ['B', 'L', 'D'] },
  { day: 'Fri', meals: ['L', 'D'] },
  { day: 'Sat', meals: ['B', 'L', 'D'] },
  { day: 'Sun', meals: ['B', 'D'] },
]

export function AutomationOverviewSection() {
  return (
    <section id="automation" className="marketing-section scroll-mt-24 bg-[var(--marketing-subtle)]/70">
      <div className="marketing-container">
        <SectionHeading
          eyebrow="Mess operations on autopilot"
          title="One app. Two powerful automation engines."
          description="Recurring routines run by themselves, while AI handles every exception through a safe preview-and-confirm flow."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {automationModes.map(({ eyebrow, title, text, icon: Icon, bullets }, index) => (
            <article key={title} className="marketing-card marketing-card-hover relative overflow-hidden rounded-2xl p-6 sm:p-8">
              <div className="absolute -right-14 -top-14 size-40 rounded-full bg-[var(--brand)]/8 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <span className="icon-tile size-14"><Icon size={24} /></span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{eyebrow}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h3>
                </div>
              </div>
              <p className="relative mt-5 text-sm font-medium leading-7 text-muted-foreground">{text}</p>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                {bullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-2 rounded-xl bg-[var(--marketing-subtle)] px-3 py-3 text-xs font-bold text-foreground">
                    <CheckCircle2 size={15} className="shrink-0 text-[var(--brand)]" /> {bullet}
                  </div>
                ))}
              </div>
              <span className="absolute bottom-5 right-6 text-7xl font-semibold text-[var(--brand)]/[0.04]">0{index + 1}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AiWorkflowSection() {
  return (
    <section className="marketing-section overflow-hidden">
      <div className="marketing-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(250px,.65fr)]">
        <div>
          <span className="marketing-eyebrow gap-2"><Sparkles size={13} /> AI Quick Add</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-4xl">
            Say it once. Review it. Consider it done.
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
            Add a meal, expense, utility cost, or deposit using text or voice. Messzen understands the action, prepares an editable preview, and saves only after confirmation.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'Natural Bangla, English, and Banglish commands',
              'Nothing is saved before review',
              'The correct record and monthly balance update together',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-bold text-foreground">
                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"><Check size={14} /></span>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl border border-[var(--marketing-line)] bg-[var(--marketing-subtle)] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]"><Mic2 size={15} /> Example command</p>
            <p className="mt-2 text-sm font-bold leading-6 text-foreground">“Add Rahim deposit 2000”</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[340px]">
          <MarketingMobileAppTour variant="ai" presentation="device" />
        </div>
      </div>
    </section>
  )
}

export function MealPatternSection() {
  return (
    <section id="meal-pattern" className="marketing-section scroll-mt-24 bg-[var(--marketing-subtle)]/70 overflow-hidden">
      <div className="marketing-container grid items-center gap-12 xl:grid-cols-[1.35fr_.65fr]">
        <div className="mx-auto grid w-full max-w-3xl items-center gap-5 md:grid-cols-[minmax(260px,340px)_minmax(300px,1fr)]">
          <MarketingMobileAppTour variant="meal-pattern" presentation="device" />
          <div className="marketing-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Weekly meal pattern</p>
                <h3 className="mt-1 text-base font-semibold text-foreground">Rahim’s recurring schedule</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {weeklyPattern.map((pattern) => (
                <div key={pattern.day} className="rounded-xl bg-[var(--marketing-subtle)] p-2 text-center">
                  <p className="text-[9px] font-semibold text-muted-foreground">{pattern.day}</p>
                  <div className="mt-2 space-y-1">
                    {['B', 'L', 'D'].map((meal) => (
                      <span key={meal} className={`mx-auto flex size-5 items-center justify-center rounded-md text-[8px] font-semibold ${pattern.meals.includes(meal) ? 'bg-[var(--brand)] text-white' : 'bg-[var(--marketing-line)] text-muted-foreground opacity-50'}`}>{meal}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-3">
              <RefreshCw size={17} className="shrink-0 text-[var(--brand)]" />
              <p className="text-xs font-bold leading-5 text-foreground">Next week will continue automatically—no new entry needed.</p>
            </div>
          </div>
        </div>

        <div>
          <span className="marketing-eyebrow gap-2"><CalendarCheck2 size={13} /> Meal Pattern</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-4xl">Set the routine once. Stop entering meals every day.</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
            Build a daily or weekly meal pattern for each member. Messzen follows that schedule automatically and keeps meal counts and monthly calculations current.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Daily patterns', text: 'Use the same routine every day.', icon: Clock3 },
              { title: 'Weekly patterns', text: 'Create a different plan for each day.', icon: CalendarCheck2 },
              { title: 'Member-specific', text: 'Every member can follow a unique pattern.', icon: UtensilsCrossed },
              { title: 'Always in sync', text: 'Meal totals and bills keep updating.', icon: RefreshCw },
            ].map(({ title, text, icon: Icon }) => (
              <div key={title} className="marketing-card rounded-xl p-4">
                <Icon size={18} className="text-[var(--brand)]" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function DedicatedAppSection() {
  return (
    <section className="marketing-section overflow-hidden">
      <div className="marketing-container">
        <SectionHeading
          eyebrow="Dedicated mobile app"
          title="Your complete mess operation, right in your pocket"
          description="Managers and members get a focused app for everyday actions, while every update stays connected to the web dashboard."
        />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div className="mx-auto w-full max-w-[340px]">
            <MarketingMobileAppTour variant="app" presentation="device" />
          </div>

          <div className="space-y-4">
            {[
              { title: 'Manage every daily action', text: 'Meals, expenses, deposits, notices, members, and bills stay a tap away.', icon: Bot },
              { title: 'Designed for fast decisions', text: 'Clear summaries show what changed, what is due, and what needs attention.', icon: ShieldCheck },
              { title: 'Web and app stay connected', text: 'The dedicated app gives you mobile speed without losing dashboard visibility.', icon: RefreshCw },
            ].map(({ title, text, icon: Icon }) => (
              <article key={title} className="marketing-card flex gap-4 rounded-2xl p-5">
                <span className="icon-tile"><Icon size={20} /></span>
                <div><h3 className="text-base font-semibold text-foreground">{title}</h3><p className="mt-1.5 text-sm font-medium leading-6 text-muted-foreground">{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function BillingAndAlertsSection() {
  const notifications = [
    { title: 'Meal reminder', text: 'Confirm dinner before the meal closes.', icon: UtensilsCrossed, tone: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
    { title: 'Payment due', text: 'A member payment needs attention.', icon: CreditCard, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    { title: 'Bazar alarm', text: 'Tomorrow’s bazar responsibility is assigned.', icon: ShoppingBasket, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  ]

  return (
    <section className="marketing-section bg-[var(--marketing-subtle)]/70 overflow-hidden">
      <div className="marketing-container space-y-20">
        <div className="grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="marketing-eyebrow gap-2"><ReceiptText size={13} /> Live monthly billing</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-4xl">Every update flows into the final calculation.</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">Meals, expenses, utilities, deposits, payments, and previous balances stay connected. Messzen keeps member-wise monthly bills ready without rebuilding the calculation by hand.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Meals', 'Expenses', 'Utilities', 'Deposits', 'Previous balance'].map((item) => <span key={item} className="rounded-full border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-3 py-2 text-xs font-bold text-foreground">{item}</span>)}
            </div>
          </div>
          <div className="relative mx-auto flex min-h-[520px] w-full max-w-xl items-end justify-center sm:min-h-[620px]">
            <AppScreenshot src="/monthly-bill-management.webp.jpeg" alt="Manager monthly bill overview" className="absolute left-[8%] top-0 w-[43%] rotate-[-3deg]" sizes="260px" />
            <AppScreenshot src="/my-monthly-bill.webp.jpeg" alt="Member monthly bill breakdown" className="absolute bottom-0 right-[8%] z-10 w-[43%] rotate-[3deg]" sizes="260px" />
          </div>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative mx-auto min-h-[520px] w-full max-w-xl">
            <AppScreenshot src="/app-home.webp.jpeg" alt="Messzen app with notification access" className="absolute left-[8%] top-0 w-[42%]" sizes="250px" />
            <div className="absolute right-0 top-[14%] z-10 w-[67%] space-y-3">
              {notifications.map(({ title, text, icon: Icon, tone }, index) => (
                <div key={title} className="marketing-card flex items-center gap-3 rounded-2xl p-4" style={{ transform: `translateX(${index * 10}px)` }}>
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
                  <div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-0.5 text-[11px] font-medium leading-5 text-muted-foreground">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="marketing-eyebrow gap-2"><BellRing size={13} /> Smart push notifications</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-4xl">Messzen remembers what your mess should not miss.</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">Proactive alerts keep members and managers ahead of meal deadlines, payment dues, and bazar responsibilities—even when the app is not open.</p>
            <div className="mt-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><BellRing size={17} className="text-[var(--brand)]" /> Timely, useful, and action-focused</p>
              <p className="mt-2 text-xs font-medium leading-6 text-muted-foreground">Each reminder points to a real task, so people know exactly what needs attention.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AutomationCta() {
  return (
    <div className="marketing-container px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] px-6 py-9 text-center text-white shadow-[0_20px_50px_var(--brand-shadow)] sm:px-10">
        <WalletCards className="mx-auto" size={28} />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Set the routine. Let Messzen handle the repetition.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-7 text-white/80">Automate meal patterns, use AI for changes, keep bills calculated, and notify everyone at the right time.</p>
        <Link href="/register" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[var(--brand-dark)] shadow-lg transition hover:-translate-y-0.5">Start for Free <ArrowRight size={16} /></Link>
      </div>
    </div>
  )
}
