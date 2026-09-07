'use client'

import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react'
import { ProductTourPreviewSuite } from '@/components/product-tour/product-tour-preview-suite'
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
    <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-14 lg:pt-16">
      <div className="marketing-container relative grid items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-10">
        <div>
          <span className="marketing-eyebrow gap-2 normal-case tracking-normal">
            <Sparkles size={13} /> {t('hero.eyebrow')}
          </span>

          <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.65rem]">
            {t('hero.titleLineOne')}
            <br /> {t('hero.titleLineTwo')}
            <br />
            <span className="text-[var(--brand)]">
              {t('hero.titleAccent')}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base font-normal leading-8 text-muted-foreground">
            {t('hero.description')}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="brand-button h-12 px-6">
              {t('hero.startFree')} <ArrowRight size={16} />
            </Link>
            <Link href="#how-it-works" className="ghost-button h-12 px-6">
              {t('hero.seeHow')} <Play size={15} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
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

        <div className="relative mx-auto w-full max-w-[820px]">
          <div className="relative">
            <ProductTourPreviewSuite />
          </div>
        </div>
      </div>
    </section>
  )
}
