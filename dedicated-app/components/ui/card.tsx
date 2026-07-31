'use client'

import type { AriaRole, ReactNode } from 'react'

type CardVariant = 'default' | 'flat' | 'flush' | 'tint' | 'hero'

export function Card({
  children,
  variant = 'default',
  title,
  subtitle,
  action,
  className = '',
  as = 'section',
  role,
  ariaLabel,
}: {
  children: ReactNode
  variant?: CardVariant
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
  as?: 'section' | 'div'
  role?: AriaRole
  ariaLabel?: string
}) {
  const Element = as

  const variantClass = {
    default: 'ui-card',
    flat: 'ui-card ui-card--flat',
    flush: 'ui-card ui-card--flush',
    tint: 'ui-card ui-card--tint',
    hero: 'ui-card ui-card--hero',
  }[variant]

  return (
    <Element className={`${variantClass} ${className}`.trim()} role={role} aria-label={ariaLabel}>
      {title || subtitle || action ? (
        <div className="ui-row-between mb-2">
          <div className="min-w-0">
            {title ? <h2 className={variant === 'hero' ? 'ui-card-title text-white!' : 'ui-card-title'}>{title}</h2> : null}
            {subtitle ? <p className={`ui-card-subtitle ${variant === 'hero' ? 'text-white/80!' : ''}`}>{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </Element>
  )
}

export function CardGrid({
  children,
  columns = 2,
  className = '',
}: {
  children: ReactNode
  columns?: 2 | 3
  className?: string
}) {
  return <div className={`${columns === 2 ? 'ui-grid-2' : 'ui-grid-3'} ${className}`.trim()}>{children}</div>
}

export function ListItem({
  children,
  variant = 'flush',
  active = false,
  className = '',
}: {
  children: ReactNode
  variant?: 'card' | 'flush' | 'flat'
  active?: boolean
  className?: string
}) {
  const variantClass = {
    card: 'ui-list-item ui-list-item--card',
    flush: 'ui-list-item ui-list-item--flush',
    flat: 'ui-card ui-card--flat ui-card--flush ui-list-item',
  }[variant]

  return <div className={`${variantClass} ${active ? 'ui-list-item--active' : ''} ${className}`.trim()}>{children}</div>
}