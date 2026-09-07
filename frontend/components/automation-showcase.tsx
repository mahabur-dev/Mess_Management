'use client'

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
  type LucideIcon,
} from 'lucide-react'
import { AppScreenshot } from '@/components/app-screenshot'
import { MarketingMobileAppTour } from '@/components/marketing-mobile-app-tour'
import { SectionHeading } from '@/components/marketing-section'
import { useTranslations, type MessageKey } from '@/lib/i18n'

type MarketingKey = MessageKey<'marketing'>

const automationModes: Array<{ eyebrowKey: MarketingKey; titleKey: MarketingKey; textKey: MarketingKey; icon: LucideIcon; bulletKeys: MarketingKey[] }> = [
  {
    eyebrowKey: 'overview.recurringEyebrow',
    titleKey: 'overview.recurringTitle',
    textKey: 'overview.recurringText',
    icon: RefreshCw,
    bulletKeys: ['overview.recurringBulletOne', 'overview.recurringBulletTwo', 'overview.recurringBulletThree'],
  },
  {
    eyebrowKey: 'overview.aiEyebrow',
    titleKey: 'overview.aiTitle',
    textKey: 'overview.aiText',
    icon: WandSparkles,
    bulletKeys: ['overview.aiBulletOne', 'overview.aiBulletTwo', 'overview.aiBulletThree'],
  },
]

const weeklyPattern: Array<{ dayKey: MarketingKey; meals: string[] }> = [
  { dayKey: 'mealPattern.mon', meals: ['B', 'L', 'D'] },
  { dayKey: 'mealPattern.tue', meals: ['L', 'D'] },
  { dayKey: 'mealPattern.wed', meals: ['B', 'L', 'D'] },
  { dayKey: 'mealPattern.thu', meals: ['B', 'L', 'D'] },
  { dayKey: 'mealPattern.fri', meals: ['L', 'D'] },
  { dayKey: 'mealPattern.sat', meals: ['B', 'L', 'D'] },
  { dayKey: 'mealPattern.sun', meals: ['B', 'D'] },
]

const mealLabelKeys: Record<string, MarketingKey> = {
  B: 'mealPattern.breakfastShort',
  L: 'mealPattern.lunchShort',
  D: 'mealPattern.dinnerShort',
}

export function AutomationOverviewSection() {
  const t = useTranslations('marketing')

  return (
    <section id="automation" className="marketing-section scroll-mt-24 bg-[var(--marketing-subtle)]/70">
      <div className="marketing-container">
        <SectionHeading
          eyebrow={t('overview.eyebrow')}
          title={t('overview.title')}
          description={t('overview.description')}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {automationModes.map(({ eyebrowKey, titleKey, textKey, icon: Icon, bulletKeys }, index) => (
            <article key={titleKey} className="marketing-card marketing-card-hover relative overflow-hidden rounded-2xl p-6 sm:p-8">
              <div className="relative flex items-start gap-4">
                <span className="icon-tile size-14"><Icon size={24} /></span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{t(eyebrowKey)}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t(titleKey)}</h3>
                </div>
              </div>
              <p className="relative mt-5 text-sm font-medium leading-7 text-muted-foreground">{t(textKey)}</p>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                {bulletKeys.map((bulletKey) => (
                  <div key={bulletKey} className="flex items-center gap-2 rounded-xl bg-[var(--marketing-subtle)] px-3 py-3 text-xs font-semibold text-foreground">
                    <CheckCircle2 size={15} className="shrink-0 text-[var(--brand)]" /> {t(bulletKey)}
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
  const t = useTranslations('marketing')
  const benefitKeys: MarketingKey[] = ['ai.benefitOne', 'ai.benefitTwo', 'ai.benefitThree']

  return (
    <section className="marketing-section overflow-hidden">
      <div className="marketing-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(250px,.65fr)]">
        <div>
          <span className="marketing-eyebrow gap-2"><Sparkles size={13} /> {t('ai.eyebrow')}</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            {t('ai.title')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
            {t('ai.description')}
          </p>
          <div className="mt-6 space-y-3">
            {benefitKeys.map((key) => (
              <div key={key} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"><Check size={14} /></span>
                {t(key)}
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl border border-[var(--marketing-line)] bg-[var(--marketing-subtle)] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]"><Mic2 size={15} /> {t('ai.exampleLabel')}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{t('ai.example')}</p>
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
  const t = useTranslations('marketing')
  const patternFeatures: Array<{ titleKey: MarketingKey; textKey: MarketingKey; icon: LucideIcon }> = [
    { titleKey: 'mealPattern.dailyTitle', textKey: 'mealPattern.dailyText', icon: Clock3 },
    { titleKey: 'mealPattern.weeklyTitle', textKey: 'mealPattern.weeklyText', icon: CalendarCheck2 },
    { titleKey: 'mealPattern.memberTitle', textKey: 'mealPattern.memberText', icon: UtensilsCrossed },
    { titleKey: 'mealPattern.syncTitle', textKey: 'mealPattern.syncText', icon: RefreshCw },
  ]

  return (
    <section id="meal-pattern" className="marketing-section scroll-mt-24 bg-[var(--marketing-subtle)]/70 overflow-hidden">
      <div className="marketing-container grid items-center gap-12 xl:grid-cols-[1.35fr_.65fr]">
        <div className="mx-auto grid w-full max-w-3xl items-center gap-5 md:grid-cols-[minmax(260px,340px)_minmax(300px,1fr)]">
          <MarketingMobileAppTour variant="meal-pattern" presentation="device" />
          <div className="marketing-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{t('mealPattern.cardEyebrow')}</p>
                <h3 className="mt-1 text-base font-semibold text-foreground">{t('mealPattern.cardTitle')}</h3>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[10px] font-semibold text-[var(--brand)]">{t('mealPattern.active')}</span>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {weeklyPattern.map((pattern) => (
                <div key={pattern.dayKey} className="rounded-xl bg-[var(--marketing-subtle)] p-2 text-center">
                  <p className="truncate text-[9px] font-semibold text-muted-foreground">{t(pattern.dayKey)}</p>
                  <div className="mt-2 space-y-1">
                    {['B', 'L', 'D'].map((meal) => (
                      <span key={meal} className={`mx-auto flex size-5 items-center justify-center rounded-md text-[8px] font-semibold ${pattern.meals.includes(meal) ? 'bg-[var(--brand)] text-white' : 'bg-[var(--marketing-line)] text-muted-foreground opacity-50'}`}>{t(mealLabelKeys[meal])}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-3">
              <RefreshCw size={17} className="shrink-0 text-[var(--brand)]" />
              <p className="text-xs font-semibold leading-5 text-foreground">{t('mealPattern.automaticNote')}</p>
            </div>
          </div>
        </div>

        <div>
          <span className="marketing-eyebrow gap-2"><CalendarCheck2 size={13} /> {t('mealPattern.eyebrow')}</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">{t('mealPattern.title')}</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
            {t('mealPattern.description')}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {patternFeatures.map(({ titleKey, textKey, icon: Icon }) => (
              <div key={titleKey} className="marketing-card rounded-xl p-4">
                <Icon size={18} className="text-[var(--brand)]" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{t(titleKey)}</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function DedicatedAppSection() {
  const t = useTranslations('marketing')
  const appFeatures: Array<{ titleKey: MarketingKey; textKey: MarketingKey; icon: LucideIcon }> = [
    { titleKey: 'mobileApp.actionTitle', textKey: 'mobileApp.actionText', icon: Bot },
    { titleKey: 'mobileApp.decisionTitle', textKey: 'mobileApp.decisionText', icon: ShieldCheck },
    { titleKey: 'mobileApp.connectedTitle', textKey: 'mobileApp.connectedText', icon: RefreshCw },
  ]

  return (
    <section className="marketing-section overflow-hidden">
      <div className="marketing-container">
        <SectionHeading
          eyebrow={t('mobileApp.eyebrow')}
          title={t('mobileApp.title')}
          description={t('mobileApp.description')}
        />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div className="mx-auto w-full max-w-[340px]">
            <MarketingMobileAppTour variant="app" presentation="device" />
          </div>

          <div className="space-y-4">
            {appFeatures.map(({ titleKey, textKey, icon: Icon }) => (
              <article key={titleKey} className="marketing-card flex gap-4 rounded-2xl p-5">
                <span className="icon-tile"><Icon size={20} /></span>
                <div><h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3><p className="mt-1.5 text-sm font-medium leading-6 text-muted-foreground">{t(textKey)}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function BillingAndAlertsSection() {
  const t = useTranslations('marketing')
  const notifications: Array<{ titleKey: MarketingKey; textKey: MarketingKey; icon: LucideIcon }> = [
    { titleKey: 'alerts.mealTitle', textKey: 'alerts.mealText', icon: UtensilsCrossed },
    { titleKey: 'alerts.paymentTitle', textKey: 'alerts.paymentText', icon: CreditCard },
    { titleKey: 'alerts.bazarTitle', textKey: 'alerts.bazarText', icon: ShoppingBasket },
  ]
  const billingKeys: MarketingKey[] = ['billing.meals', 'billing.expenses', 'billing.utilities', 'billing.deposits', 'billing.previousBalance']

  return (
    <section className="marketing-section bg-[var(--marketing-subtle)]/70 overflow-hidden">
      <div className="marketing-container space-y-20">
        <div className="grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="marketing-eyebrow gap-2"><ReceiptText size={13} /> {t('billing.eyebrow')}</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">{t('billing.title')}</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">{t('billing.description')}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {billingKeys.map((key) => <span key={key} className="rounded-full border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-3 py-2 text-xs font-semibold text-foreground">{t(key)}</span>)}
            </div>
          </div>
          <div className="relative mx-auto flex min-h-[520px] w-full max-w-xl items-end justify-center sm:min-h-[620px]">
            <AppScreenshot src="/monthly-bill-management.webp.jpeg" alt={t('billing.managerImageAlt')} className="absolute left-[8%] top-0 w-[43%] rotate-[-3deg]" sizes="260px" />
            <AppScreenshot src="/my-monthly-bill.webp.jpeg" alt={t('billing.memberImageAlt')} className="absolute bottom-0 right-[8%] z-10 w-[43%] rotate-[3deg]" sizes="260px" />
          </div>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative mx-auto min-h-[520px] w-full max-w-xl">
            <AppScreenshot src="/app-home.webp.jpeg" alt={t('alerts.appImageAlt')} className="absolute left-[8%] top-0 w-[42%]" sizes="250px" />
            <div className="absolute right-0 top-[14%] z-10 w-[67%] space-y-3">
              {notifications.map(({ titleKey, textKey, icon: Icon }, index) => (
                <div key={titleKey} className="marketing-card flex items-center gap-3 rounded-2xl p-4" style={{ transform: `translateX(${index * 10}px)` }}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Icon size={18} /></span>
                  <div><p className="text-sm font-semibold text-foreground">{t(titleKey)}</p><p className="mt-0.5 text-[11px] font-medium leading-5 text-muted-foreground">{t(textKey)}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="marketing-eyebrow gap-2"><BellRing size={13} /> {t('alerts.eyebrow')}</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">{t('alerts.title')}</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">{t('alerts.description')}</p>
            <div className="mt-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><BellRing size={17} className="text-[var(--brand)]" /> {t('alerts.noteTitle')}</p>
              <p className="mt-2 text-xs font-medium leading-6 text-muted-foreground">{t('alerts.noteText')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AutomationCta() {
  const t = useTranslations('marketing')

  return (
    <div className="marketing-container px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl bg-[var(--brand)] px-6 py-9 text-center text-white sm:px-10">
        <WalletCards className="mx-auto" size={28} />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{t('automationCta.title')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-7 text-white/80">{t('automationCta.description')}</p>
        <Link href="/register" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--brand-soft)]">{t('automationCta.action')} <ArrowRight size={16} /></Link>
      </div>
    </div>
  )
}
