'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, BarChart3, CheckCircle2, Clock3, HeartHandshake, Quote,
  ReceiptText, ShieldCheck, UtensilsCrossed, UsersRound, type LucideIcon,
} from 'lucide-react'
import { MarketingStatsBar } from '@/components/marketing-stats'
import { SectionHeading } from '@/components/marketing-section'
import { useTranslations, type MessageKey } from '@/lib/i18n'

type MarketingKey = MessageKey<'marketing'>
type CopyCard = { titleKey: MarketingKey; textKey: MarketingKey; icon: LucideIcon }

const values: CopyCard[] = [
  { titleKey: 'about.simpleTitle', textKey: 'about.simpleText', icon: CheckCircle2 },
  { titleKey: 'about.transparentTitle', textKey: 'about.transparentText', icon: ShieldCheck },
  { titleKey: 'about.communityTitle', textKey: 'about.communityText', icon: HeartHandshake },
  { titleKey: 'about.timeTitle', textKey: 'about.timeText', icon: Clock3 },
]

const capabilities: Array<{ labelKey: MarketingKey; icon: LucideIcon }> = [
  { labelKey: 'about.mealTracking', icon: UtensilsCrossed },
  { labelKey: 'about.memberManagement', icon: UsersRound },
  { labelKey: 'about.monthlyBilling', icon: ReceiptText },
  { labelKey: 'about.insights', icon: BarChart3 },
]

const benefitKeys: MarketingKey[] = ['about.benefitOne', 'about.benefitTwo', 'about.benefitThree']

export function AboutPageClient() {
  const t = useTranslations('marketing')

  return (
    <main className="marketing-page">
      <section className="marketing-section relative overflow-hidden">
        <div className="marketing-container relative grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="marketing-eyebrow">{t('about.eyebrow')}</span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-foreground sm:text-5xl">{t('about.title')}</h1>
            <p className="mt-5 text-base font-medium leading-8 text-muted-foreground">{t('about.description')}</p>
            <Link href="/register" className="brand-button mt-7 h-12 px-6">{t('about.action')} <ArrowRight size={16} /></Link>
          </div>
          <div className="marketing-card overflow-hidden rounded-2xl p-2 sm:p-3">
            <Image src="/labtop-dashboard.webp" alt={t('about.dashboardAlt')} width={1366} height={1292} priority className="aspect-[1.55/1] w-full rounded-xl object-cover object-top" />
          </div>
        </div>
      </section>

      <section className="marketing-section bg-[var(--marketing-subtle)]/70">
        <div className="marketing-container">
          <SectionHeading eyebrow={t('about.approachEyebrow')} title={t('about.approachTitle')} description={t('about.approachText')} />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map(({ titleKey, textKey, icon: Icon }) => (
              <article key={titleKey} className="marketing-card marketing-card-hover rounded-2xl p-6">
                <span className="icon-tile"><Icon size={21} /></span>
                <h2 className="mt-5 text-base font-semibold text-foreground">{t(titleKey)}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{t(textKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--brand)] p-7 text-white">
            <div className="grid grid-cols-2 gap-3">
              {capabilities.map(({ labelKey, icon: Icon }) => (
                <div key={labelKey} className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <Icon size={22} />
                  <p className="mt-3 text-sm font-semibold">{t(labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="marketing-eyebrow">{t('about.whyEyebrow')}</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('about.whyTitle')}</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">{t('about.whyText')}</p>
            <ul className="mt-6 space-y-3">
              {benefitKeys.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm font-semibold text-foreground"><CheckCircle2 size={17} className="shrink-0 text-[var(--brand)]" />{t(key)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="marketing-section bg-[var(--marketing-subtle)]/70">
        <div className="marketing-container">
          <MarketingStatsBar />
          <div className="marketing-card mt-10 grid items-center gap-7 rounded-2xl p-6 sm:p-8 lg:grid-cols-[auto_.7fr_1.3fr]">
            <div className="mx-auto size-36 overflow-hidden rounded-2xl bg-[var(--brand-soft)] lg:mx-0">
              <Image src="/ai-photo.webp" alt={t('about.founderAlt')} width={420} height={500} className="h-full w-full object-cover" />
            </div>
            <div className="text-center lg:text-left">
              <p className="marketing-eyebrow">{t('about.founder')}</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">Mahabur Rahman</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--brand)]">{t('about.founderRole')}</p>
            </div>
            <blockquote className="border-t border-[var(--marketing-line)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <Quote size={24} className="text-[var(--brand)]" />
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">{t('about.quote')}</p>
            </blockquote>
          </div>
        </div>
      </section>
    </main>
  )
}
