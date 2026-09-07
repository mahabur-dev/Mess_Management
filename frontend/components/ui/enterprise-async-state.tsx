'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Inbox, LoaderCircle, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'

export type EnterpriseAsyncStatus = 'loading' | 'empty' | 'error'
export type EnterpriseAsyncSurface = 'plain' | 'panel'

interface EnterpriseAsyncStateProps {
  status: EnterpriseAsyncStatus
  title?: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
  surface?: EnterpriseAsyncSurface
  compact?: boolean
  className?: string
}

const defaultIcons: Record<EnterpriseAsyncStatus, LucideIcon> = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertCircle,
}

/**
 * A shared, accessible state surface for loading, empty and recoverable-error UI.
 * Callers can supply domain-specific copy while retaining consistent layout.
 */
export function EnterpriseAsyncState({
  status,
  title,
  description,
  action,
  icon,
  surface = 'panel',
  compact = false,
  className,
}: EnterpriseAsyncStateProps) {
  const shared = useTranslations('shared')
  const Icon = icon ?? defaultIcons[status]
  const resolvedTitle = title ?? (
    status === 'loading'
      ? shared('loadingData')
      : status === 'empty'
        ? shared('emptyTitle')
        : shared('errorTitle')
  )
  const resolvedDescription = description ?? (
    status === 'empty'
      ? shared('emptyDescription')
      : status === 'error'
        ? shared('errorDescription')
        : undefined
  )

  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      aria-live={status === 'error' ? 'assertive' : 'polite'}
      aria-busy={status === 'loading' || undefined}
      className={cn(
        'flex min-w-0 flex-col items-center justify-center text-center',
        surface === 'panel' &&
          'rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]',
        compact ? 'gap-2 px-4 py-7' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-lg border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] text-[var(--brand)]',
          compact ? 'size-9' : 'size-11',
        )}
        aria-hidden="true"
      >
        <Icon className={cn(compact ? 'size-4' : 'size-5', status === 'loading' && 'animate-spin motion-reduce:animate-none')} />
      </span>

      <div className="max-w-md">
        <p className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {resolvedTitle}
        </p>
        {resolvedDescription ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
        ) : null}
      </div>

      {action ? <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  )
}

interface EnterpriseTableStateRowProps
  extends Omit<EnterpriseAsyncStateProps, 'surface' | 'className'> {
  colSpan: number
  className?: string
}

/** Places the shared state treatment inside a semantically valid table row. */
export function EnterpriseTableStateRow({
  colSpan,
  className,
  ...stateProps
}: EnterpriseTableStateRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn('p-0', className)}>
        <EnterpriseAsyncState {...stateProps} surface="plain" compact />
      </td>
    </tr>
  )
}
