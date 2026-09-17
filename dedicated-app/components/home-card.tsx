'use client'

import type { AriaRole, ComponentType, ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'
import { Surface } from '@/components/ui/surface'

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
  return (
    <Surface
      as={as}
      elevation="none"
      className={classes('home-card ui-card app-section', className)}
      role={role}
      ariaLabel={ariaLabel}
    >
      {title || caption || action ? (
        <div className="home-card__header">
          <div className="min-w-0 flex-1">
            {title ? <h2 className="ui-section-title mb-0!">{title}</h2> : null}
            {caption ? <p className="home-card__caption">{caption}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </Surface>
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
    <Surface as="article" elevation="none" className="home-metric-card">
      <span className="home-metric-card__icon" style={{ backgroundColor: `${accent}12`, color: accent }}>
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="home-metric-card__label">{label}</span>
        <span className="home-metric-card__value">{value}</span>
      </span>
    </Surface>
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
      <span className="text-label font-medium text-[#3d5560]">{label}</span>
    </button>
  )
}

export function HomeEmptyState({ children }: { children: ReactNode }) {
  return <div className="home-empty-state">{children}</div>
}
