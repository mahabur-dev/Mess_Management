import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Quote,
  ReceiptText,
  ShieldCheck,
  UtensilsCrossed,
  UsersRound,
} from 'lucide-react'
import { MarketingStatsBar } from '@/components/marketing-stats'
import { SectionHeading } from '@/components/marketing-section'

export const metadata: Metadata = {
  title: 'About Us | Messzen.com',
  description: 'Learn how Messzen makes shared living calmer through transparent meals, expenses, billing, and communication.',
}

const values = [
  { title: 'Simple by design', text: 'Important daily actions stay clear for managers and members, without unnecessary complexity.', icon: CheckCircle2 },
  { title: 'Transparent by default', text: 'Meals, costs, deposits, and bills remain easy to understand and verify.', icon: ShieldCheck },
  { title: 'Built for real communities', text: 'Every workflow starts with the everyday needs of people who share a home.', icon: HeartHandshake },
  { title: 'Time back for everyone', text: 'Reliable automation reduces repetitive calculations and manual follow-up.', icon: Clock3 },
]

const capabilities = [
  { label: 'Meal tracking', icon: UtensilsCrossed },
  { label: 'Member management', icon: UsersRound },
  { label: 'Monthly billing', icon: ReceiptText },
  { label: 'Actionable insights', icon: BarChart3 },
]

export default function AboutPage() {
  return (
    <main className="marketing-page">
      <section className="marketing-section relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 rounded-full bg-[var(--brand)]/10 blur-3xl" />
        <div className="marketing-container relative grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="marketing-eyebrow">About Messzen</span>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-[-0.05em] text-foreground sm:text-5xl">
              Shared living deserves a clearer system.
            </h1>
            <p className="mt-5 text-base font-medium leading-8 text-muted-foreground">
              Messzen was created to replace scattered notes, confusing calculations, and repetitive follow-ups with one calm, transparent workspace.
            </p>
            <Link href="/register" className="brand-button mt-7 h-12 px-6">Start for Free <ArrowRight size={16} /></Link>
          </div>
          <div className="marketing-card overflow-hidden rounded-2xl p-2 sm:p-3">
            <Image src="/dashboard.webp" alt="Messzen management dashboard" width={1366} height={1292} priority className="aspect-[1.55/1] w-full rounded-xl object-cover object-top" />
          </div>
        </div>
      </section>

      <section className="marketing-section bg-[var(--marketing-subtle)]/70">
        <div className="marketing-container">
          <SectionHeading eyebrow="Our approach" title="Less admin. More trust." description="We focus on the practical details that keep a mess community running smoothly every day." />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map(({ title, text, icon: Icon }) => (
              <article key={title} className="marketing-card marketing-card-hover rounded-2xl p-6">
                <span className="icon-tile"><Icon size={21} /></span>
                <h2 className="mt-5 text-base font-black text-foreground">{title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="marketing-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand)] p-7 text-white">
            <div className="grid grid-cols-2 gap-3">
              {capabilities.map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur-sm">
                  <Icon size={22} />
                  <p className="mt-3 text-sm font-black">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="marketing-eyebrow">Why we built it</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">One source of truth for the whole mess</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
              When everyone can see the same meal records, expenses, deposits, notices, and bills, daily operations become faster and disagreements become easier to avoid.
            </p>
            <ul className="mt-6 space-y-3">
              {['Clear roles for managers and members', 'Reliable calculations at monthly close', 'Useful on desktop and mobile screens'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-bold text-foreground"><CheckCircle2 size={17} className="text-[var(--brand)]" />{item}</li>
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
              <Image src="/ai-photo.webp" alt="Mahabur Rahman, founder of Messzen" width={420} height={500} className="h-full w-full object-cover" />
            </div>
            <div className="text-center lg:text-left">
              <p className="marketing-eyebrow">Founder</p>
              <h2 className="mt-3 text-2xl font-black text-foreground">Mahabur Rahman</h2>
              <p className="mt-1 text-sm font-bold text-[var(--brand)]">Founder, Messzen</p>
            </div>
            <blockquote className="border-t border-[var(--marketing-line)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <Quote size={24} className="text-[var(--brand)]" />
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
                Messzen exists to make the everyday work of shared living more organized, accountable, and peaceful for everyone involved.
              </p>
            </blockquote>
          </div>
        </div>
      </section>
    </main>
  )
}
