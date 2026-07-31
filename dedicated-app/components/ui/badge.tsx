'use client'

import type { ReactNode } from 'react'

type BadgeTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

export function Badge({
  children,
  tone = 'info',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  const toneClass = {
    success: 'ui-badge--success',
    info: 'ui-badge--info',
    warning: 'ui-badge--warning',
    danger: 'ui-badge--danger',
    neutral: 'ui-badge--neutral',
  }[tone]

  return <span className={`ui-badge ${toneClass} ${className}`.trim()}>{children}</span>
}

export function StatusPill({
  children,
  tone = 'neutral',
  uppercase = true,
}: {
  children: ReactNode
  tone?: BadgeTone
  uppercase?: boolean
}) {
  return <Badge tone={tone} className={uppercase ? 'uppercase' : ''}>{children}</Badge>
}