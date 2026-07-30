'use client'

import type { AriaRole, ComponentType, ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ')
}

export function HomeCard({
  children,
  title,
  caption,
  action,
  className,
  as = 'section',
  role,
  ariaLabel,
}: {
  children: ReactNode
  title?: string
  caption?: string
  action?: ReactNode
  className?: string
  as?: 'section' | 'div'
  role?: AriaRole
  ariaLabel?: string
}) {
  const Element = as

  return (
    <Element className={classes('home-card', className)} role={role} aria-label={ariaLabel}>
      {title || caption || action ? (
        <div className="home-card__header">
          <div className="min-w-0 flex-1">
            {title ? <h2 className="section-title !mb-0">{title}</h2> : null}
            {caption ? <p className="home-card__caption">{caption}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </Element>
  )
}

export function HomeMetricCard({
  label,
  value,
  icon: Icon,
  accent = '#008d8c',
}: {
  label: string
  value: ReactNode
  icon: ComponentType<LucideProps>
  accent?: string
}) {
  return (
    <article className="home-metric-card">
      <span className="home-metric-card__icon" style={{ backgroundColor: `${accent}12`, color: accent }}>
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="home-metric-card__label">{label}</span>
        <span className="home-metric-card__value">{value}</span>
      </span>
    </article>
  )
}

export function HomeQuickAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: ComponentType<LucideProps>
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="home-quick-action">
      <span className="home-quick-action__icon">
        <Icon size={19} />
      </span>
      <span className="text-label font-semibold text-[#123748]">{label}</span>
    </button>
  )
}

export function HomeEmptyState({ children }: { children: ReactNode }) {
  return <div className="home-empty-state">{children}</div>
}
