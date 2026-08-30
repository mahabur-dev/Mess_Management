'use client'

import { useTranslations } from '@/lib/i18n'

type LoadingIndicatorProps = {
  label?: string
  variant?: 'inline' | 'card' | 'screen'
  size?: 'sm' | 'md'
  className?: string
}

export function LoadingIndicator({
  label,
  variant = 'inline',
  size = 'md',
  className = '',
}: LoadingIndicatorProps) {
  const common = useTranslations('common')
  const accessibleLabel = label ?? common('loading')
  return (
    <div
      className={`loading-indicator ${className}`}
      data-variant={variant}
      data-size={size}
      role="status"
      aria-label={accessibleLabel}
    >
      <span className="loading-indicator__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="sr-only">{accessibleLabel}</span>
    </div>
  )
}
