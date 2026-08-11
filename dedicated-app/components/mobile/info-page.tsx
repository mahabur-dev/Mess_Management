'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { ChevronRight, type LucideProps } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { appHref } from '@/lib/routes'

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
  icon: ComponentType<LucideProps>
  sections: InfoPageSection[]
  actions?: InfoPageAction[]
}) {
  return (
    <MobileShell>
      <TopScreen title={title} subtitle={subtitle} backHref="/" />
      <div className="screen space-y-4">
        <section className="info-page-hero">
          <span className="info-page-hero-icon" aria-hidden="true">
            <Icon size={27} strokeWidth={2.1} />
          </span>
          <div>
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{introduction}</span>
          </div>
        </section>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <section key={section.title} className="ui-card info-page-section">
              <span className="info-page-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
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
