import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react'
import { ProductTourPreviewSuite } from '@/components/product-tour/product-tour-preview-suite'

const people = [
  { initials: 'MR', color: 'from-teal-500 to-emerald-600' },
  { initials: 'SA', color: 'from-orange-400 to-rose-500' },
  { initials: 'NK', color: 'from-sky-500 to-blue-600' },
  { initials: 'AR', color: 'from-violet-500 to-fuchsia-600' },
]

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-14 lg:pt-16">
      <div className="pointer-events-none absolute -left-32 top-20 size-80 rounded-full bg-[var(--brand)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-0 size-96 rounded-full bg-[var(--brand-bright)]/10 blur-3xl" />

      <div className="marketing-container relative grid items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-10">
        <div>
          <span className="marketing-eyebrow gap-2 normal-case tracking-normal">
            <Sparkles size={13} /> All-in-one mess management platform
          </span>

          <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.65rem]">
            Put your mess
            <br /> on autopilot.
            <br />
            <span className="bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand-bright)] bg-clip-text text-transparent">
              Live together better.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base font-normal leading-8 text-muted-foreground">
            Set recurring meal patterns once, use text or voice for changes, and let Messzen keep records, bills, and reminders moving automatically.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="brand-button h-12 px-6">
              Start for Free <ArrowRight size={16} />
            </Link>
            <Link href="#how-it-works" className="ghost-button h-12 px-6">
              See How It Works <Play size={15} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-2.5">
              {people.map((person) => (
                <span
                  key={person.initials}
                  className={`flex size-9 items-center justify-center rounded-full border-2 border-[var(--marketing-page)] bg-gradient-to-br ${person.color} text-[9px] font-semibold text-white shadow-sm`}
                >
                  {person.initials}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Trusted by growing mess communities</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[820px]">
          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[var(--brand)]/12 via-transparent to-[var(--brand-bright)]/12 blur-2xl" />
          <div className="relative">
            <ProductTourPreviewSuite />
          </div>
        </div>
      </div>
    </section>
  )
}
