'use client'

import type { ReactNode } from 'react'

type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

export function Notice({
  children,
  tone = 'info',
  className = '',
}: {
  children: ReactNode
  tone?: NoticeTone
  className?: string
}) {
  const toneClass = {
    info: 'ui-notice--info',
    success: 'ui-notice--success',
    warning: 'ui-notice--warning',
    danger: 'ui-notice--danger',
  }[tone]

  return <div className={`ui-notice ${toneClass} ${className}`.trim()}>{children}</div>
}

export function EmptyState({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`ui-empty ${className}`.trim()}>{children}</div>
}