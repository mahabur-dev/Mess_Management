'use client'

import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react'
import { MarketingDashboardPreview } from '@/components/marketing-dashboard-preview'
import { useTranslations } from '@/lib/i18n'

const people = [
  { initials: 'MR' },
  { initials: 'SA' },
  { initials: 'NK' },
  { initials: 'AR' },
]

export function MarketingHero() {
  const t = useTranslations('marketing')

  return (
    <section className="relative overflow-hidden px-4 pb-9 pt-8 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8 lg:pb-14 lg:pt-16">
      <div className="marketing-container relative grid items-center gap-8 sm:gap-10 lg:grid-cols-[.64fr_1.36fr] lg:items-start lg:gap-6">
        <div>
          <span className="marketing-eyebrow gap-2 normal-case tracking-normal">
            <Sparkles size={13} /> {t('hero.eyebrow')}
          </span>

          <h1 className="mt-5 max-w-xl text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground min-[390px]:text-4xl sm:mt-6 sm:text-5xl lg:text-[3.65rem]">
            {t('hero.titleLineOne')}
            <br /> {t('hero.titleLineTwo')}
            <br />
            <span className="text-[var(--brand)]">
              {t('hero.titleAccent')}
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-[15px] font-normal leading-7 text-muted-foreground sm:mt-6 sm:text-base sm:leading-8">
            {t('hero.description')}
          </p>

          <div className="mt-6 grid gap-3 min-[390px]:flex sm:mt-7 sm:flex-row">
            <Link href="/register" className="brand-button h-12 w-full px-6 min-[390px]:w-auto">
              {t('hero.startFree')} <ArrowRight size={16} />
            </Link>
            <Link href="#how-it-works" className="ghost-button h-12 w-full px-6 min-[390px]:w-auto">
              {t('hero.seeHow')} <Play size={15} />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 sm:mt-8">
            <div className="flex -space-x-2.5">
              {people.map((person) => (
                <span
                  key={person.initials}
                  className="flex size-9 items-center justify-center rounded-full border-2 border-[var(--marketing-page)] bg-[var(--brand)] text-[9px] font-semibold text-white"
                >
                  {person.initials}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-[var(--brand)]">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{t('hero.trusted')}</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[1024px] lg:ml-auto lg:pt-[4.25rem]">
          <MarketingDashboardPreview />

          {/*
            The dashboard walkthrough video is retained as a future fallback.
            <div className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-black">
              <video
                className="block aspect-video w-full bg-black object-contain"
                controls
                playsInline
                preload="metadata"
                aria-label={t('hero.dashboardVideoLabel')}
              >
                <source src="/messzen-dashboard-tour.mp4" type="video/mp4" />
                {t('hero.dashboardVideoFallback')}
              </video>
            </div>
          */}
        </div>
      </div>
    </section>
  )
}
