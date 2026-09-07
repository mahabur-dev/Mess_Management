import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, FileCheck2, Mail, Phone, Scale, ShieldCheck } from 'lucide-react'

export type LegalSection = {
  id: string
  title: string
  content: ReactNode
}

type LegalPageProps = {
  kind: 'privacy' | 'terms'
  eyebrow: string
  title: string
  description: string
  effectiveDate: string
  lastUpdated: string
  sections: LegalSection[]
}

export function LegalPage({
  kind,
  eyebrow,
  title,
  description,
  effectiveDate,
  lastUpdated,
  sections,
}: LegalPageProps) {
  const HeroIcon = kind === 'privacy' ? ShieldCheck : Scale

  return (
    <main className="marketing-page">
      <section className="relative overflow-hidden border-b border-[var(--marketing-line)] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 rounded-full bg-[var(--brand)]/10 blur-3xl" />
        <div className="marketing-container relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-[var(--brand)]">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="mt-8 max-w-3xl">
            <span className="marketing-eyebrow gap-2"><HeroIcon size={13} /> {eyebrow}</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-muted-foreground sm:text-base">{description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-3.5 py-2 text-xs font-bold text-foreground">
                <CalendarDays size={14} className="text-[var(--brand)]" /> Effective {effectiveDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-3.5 py-2 text-xs font-bold text-foreground">
                <FileCheck2 size={14} className="text-[var(--brand)]" /> Updated {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-container grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24">
            <nav aria-label={`${title} sections`} className="marketing-card rounded-2xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">On this page</p>
              <ol className="mt-4 space-y-1.5">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="group flex gap-3 rounded-xl px-3 py-2.5 text-xs font-bold leading-5 text-muted-foreground transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                      <span className="font-semibold text-[var(--brand)]/70">{String(index + 1).padStart(2, '0')}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-4 rounded-2xl bg-[var(--brand)] p-5 text-white">
              <p className="text-sm font-semibold">Questions about this document?</p>
              <p className="mt-2 text-xs font-medium leading-5 text-white/75">Contact the Messzen team and we will help clarify how these terms apply.</p>
              <a href="mailto:support@messzen.com" className="mt-4 flex items-center gap-2 text-xs font-semibold text-white"><Mail size={14} /> support@messzen.com</a>
              <a href="tel:01797515386" className="mt-2 flex items-center gap-2 text-xs font-semibold text-white"><Phone size={14} /> 01797515386</a>
            </div>
          </aside>

          <article className="min-w-0 space-y-4">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="marketing-card scroll-mt-24 rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{section.title}</h2>
                    <div className="legal-copy mt-4">{section.content}</div>
                  </div>
                </div>
              </section>
            ))}

            <div className="rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-6 text-center">
              <ShieldCheck className="mx-auto text-[var(--brand)]" size={24} />
              <p className="mt-3 text-sm font-semibold text-foreground">Clear policies are part of a trustworthy platform.</p>
              <p className="mx-auto mt-2 max-w-xl text-xs font-medium leading-6 text-muted-foreground">If anything here is unclear, contact us before using the relevant feature or continuing your subscription.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
