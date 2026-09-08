'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, FileCheck2, Mail, Phone, Scale, ShieldCheck } from 'lucide-react'
import { useLocale, useLocaleFormatters } from '@/lib/i18n'
import { banglaPrivacySections, banglaTermsSections } from './legal-copy'

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
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const HeroIcon = kind === 'privacy' ? ShieldCheck : Scale
  const isBangla = locale === 'bn'
  const selectedSections = isBangla ? (kind === 'privacy' ? banglaPrivacySections : banglaTermsSections) : sections
  const localized = isBangla
    ? kind === 'privacy'
      ? {
          eyebrow: 'আস্থা ও স্বচ্ছতা', title: 'গোপনীয়তা নীতি',
          description: 'Messzen কোন তথ্য পরিচালনা করে, কেন তা প্রয়োজন, অটোমেশন ও যৌথ বসবাসের কাজে তা কীভাবে সহায়তা করে এবং আপনার কী কী পছন্দ আছে—এই নীতিতে তা ব্যাখ্যা করা হয়েছে।',
        }
      : {
          eyebrow: 'ন্যায্য ব্যবহার ও স্পষ্ট দায়িত্ব', title: 'শর্তাবলি',
          description: 'Messzen-এর অ্যাকাউন্ট, মেসের ভূমিকা, অটোমেশন, AI-সহায়ক কাজ, পরিচালন রেকর্ড, সাবস্ক্রিপশন ও দায়িত্বশীল ব্যবহারের নিয়ম এখানে ব্যাখ্যা করা হয়েছে।',
        }
    : { eyebrow, title, description }
  const displayDate = isBangla ? '১৫ আগস্ট, ২০২৬' : effectiveDate

  return (
    <main className="legal-page marketing-page">
      <section className="relative overflow-hidden border-b border-[var(--marketing-line)] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="marketing-container relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-[var(--brand)]">
            <ArrowLeft size={15} /> {isBangla ? 'হোমে ফিরে যান' : 'Back to home'}
          </Link>
          <div className="mt-8 max-w-3xl">
            <span className="marketing-eyebrow gap-2"><HeroIcon size={13} /> {localized.eyebrow}</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">{localized.title}</h1>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-muted-foreground sm:text-base">{localized.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-3.5 py-2 text-xs font-bold text-foreground">
                <CalendarDays size={14} className="text-[var(--brand)]" /> {isBangla ? 'কার্যকর' : 'Effective'} {displayDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-3.5 py-2 text-xs font-bold text-foreground">
                <FileCheck2 size={14} className="text-[var(--brand)]" /> {isBangla ? 'আপডেট' : 'Updated'} {isBangla ? displayDate : lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-container grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24">
            <nav aria-label={`${localized.title} ${isBangla ? 'বিভাগ' : 'sections'}`} className="marketing-card rounded-2xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">{isBangla ? 'এই পৃষ্ঠায়' : 'On this page'}</p>
              <ol className="mt-4 space-y-1.5">
                {selectedSections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="group flex gap-3 rounded-xl px-3 py-2.5 text-xs font-bold leading-5 text-muted-foreground transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                      <span className="font-semibold text-[var(--brand)]/70">{format.number(index + 1, { minimumIntegerDigits: 2, useGrouping: false })}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-4 rounded-2xl bg-[var(--brand)] p-5 text-white">
              <p className="text-sm font-semibold">{isBangla ? 'এই নথি সম্পর্কে প্রশ্ন আছে?' : 'Questions about this document?'}</p>
              <p className="mt-2 text-xs font-medium leading-5 text-white/75">{isBangla ? 'Messzen টিমের সঙ্গে যোগাযোগ করুন; বিষয়গুলো কীভাবে প্রযোজ্য তা বুঝতে আমরা সাহায্য করব।' : 'Contact the Messzen team and we will help clarify how these terms apply.'}</p>
              <a href="mailto:support@messzen.com" className="mt-4 flex items-center gap-2 text-xs font-semibold text-white"><Mail size={14} /> support@messzen.com</a>
              <a href="tel:01797515386" className="mt-2 flex items-center gap-2 text-xs font-semibold text-white"><Phone size={14} /> 01797515386</a>
            </div>
          </aside>

          <article className="min-w-0 space-y-4">
            {selectedSections.map((section, index) => (
              <section key={section.id} id={section.id} className="marketing-card scroll-mt-24 rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">{format.number(index + 1, { minimumIntegerDigits: 2, useGrouping: false })}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{section.title}</h2>
                    <div className="legal-copy mt-4">{section.content}</div>
                  </div>
                </div>
              </section>
            ))}

            <div className="rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-6 text-center">
              <ShieldCheck className="mx-auto text-[var(--brand)]" size={24} />
              <p className="mt-3 text-sm font-semibold text-foreground">{isBangla ? 'স্পষ্ট নীতি একটি বিশ্বাসযোগ্য প্ল্যাটফর্মের অংশ।' : 'Clear policies are part of a trustworthy platform.'}</p>
              <p className="mx-auto mt-2 max-w-xl text-xs font-medium leading-6 text-muted-foreground">{isBangla ? 'এখানে কিছু অস্পষ্ট হলে সংশ্লিষ্ট সুবিধা ব্যবহার বা সাবস্ক্রিপশন চালিয়ে যাওয়ার আগে আমাদের সঙ্গে যোগাযোগ করুন।' : 'If anything here is unclear, contact us before using the relevant feature or continuing your subscription.'}</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
