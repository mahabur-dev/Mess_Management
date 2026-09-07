'use client'

import { Badge } from '@/components/ui/badge'
import { statusLabel, useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type EnterpriseStatusTone = 'brand' | 'neutral' | 'danger'

const dangerStatuses = new Set(['REJECTED', 'CANCELLED', 'INACTIVE'])
const brandStatuses = new Set(['ACTIVE', 'APPROVED', 'COMPLETED', 'PAID', 'SOLVED', 'RESOLVED'])

interface EnterpriseStatusBadgeProps {
  status?: string | null
  label?: string
  tone?: EnterpriseStatusTone
  className?: string
}

/** Restrained brand/neutral/danger status treatment with locale-aware labels. */
export function EnterpriseStatusBadge({
  status,
  label,
  tone,
  className,
}: EnterpriseStatusBadgeProps) {
  const { locale } = useLocale()
  const normalized = String(status ?? 'ACTIVE').toUpperCase()
  const resolvedTone = tone ?? (
    dangerStatuses.has(normalized)
      ? 'danger'
      : brandStatuses.has(normalized)
        ? 'brand'
        : 'neutral'
  )

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-1 font-medium shadow-none',
        resolvedTone === 'brand' &&
          'border-[var(--brand-border)] bg-[var(--brand-softer)] text-[var(--brand-dark)] dark:text-[var(--brand)]',
        resolvedTone === 'neutral' &&
          'border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] text-muted-foreground',
        resolvedTone === 'danger' &&
          'border-destructive/30 bg-destructive/10 text-destructive',
        className,
      )}
    >
      {label ?? statusLabel(normalized, locale)}
    </Badge>
  )
}
