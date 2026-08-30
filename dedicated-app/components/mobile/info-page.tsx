'use client'

import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { AssistantInfoCard } from '@/components/mobile/assistant-info-card'
import { appHref } from '@/lib/routes'
import { useLocaleFormatters } from '@/lib/i18n'

export type InfoPageSection = {
  title: string
  body?: string
  points?: string[]
}

export type InfoPageAction = {
  href: string
  label: string
  external?: boolean
}

export function InfoPage({
  title,
  subtitle,
  eyebrow,
  introduction,
  icon: Icon,
  sections,
  actions = [],
}: {
  title: string
  subtitle: string
  eyebrow: string
  introduction: string
  icon: LucideIcon
  sections: InfoPageSection[]
  actions?: InfoPageAction[]
}) {
  const format = useLocaleFormatters()

  return (
    <MobileShell>
      <TopScreen title={title} subtitle={subtitle} backHref="/" />
      <div className="screen space-y-4">
        <AssistantInfoCard
          eyebrow={eyebrow}
          title={title}
          description={introduction}
          icon={Icon}
        />

        <div className="space-y-3">
          {sections.map((section, index) => (
            <section key={section.title} className="ui-card info-page-section">
              <span className="info-page-index" aria-hidden="true">
                {format.number(index + 1, { minimumIntegerDigits: 2, useGrouping: false })}
              </span>
              <div>
                <h2>{section.title}</h2>
                {section.body ? <p>{section.body}</p> : null}
                {section.points?.length ? (
                  <ul>
                    {section.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        {actions.length ? (
          <div className="info-page-actions">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.external ? action.href : appHref(action.href)}
                className="info-page-action"
              >
                <span>{action.label}</span>
                <ChevronRight size={18} strokeWidth={2.3} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </MobileShell>
  )
}
