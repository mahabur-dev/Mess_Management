'use client'

import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'

type ActionColumnSize = 'compact' | 'default' | 'wide'

const actionColumnWidths: Record<ActionColumnSize, string> = {
  compact: 'w-[112px] min-w-[112px]',
  default: 'w-[168px] min-w-[168px]',
  wide: 'w-[260px] min-w-[260px]',
}

interface EnterpriseTableActionHeaderProps extends ComponentProps<'th'> {
  size?: ActionColumnSize
}

/** Keeps an action-column label on the same centerline as its row controls. */
export function EnterpriseTableActionHeader({
  size = 'default',
  className,
  children,
  ...props
}: EnterpriseTableActionHeaderProps) {
  const common = useTranslations('common')

  return (
    <th
      scope="col"
      className={cn(
        'enterprise-table-label whitespace-nowrap px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground',
        actionColumnWidths[size],
        className,
      )}
      {...props}
    >
      {children ?? common('actions')}
    </th>
  )
}

interface EnterpriseTableActionCellProps extends Omit<ComponentProps<'td'>, 'children'> {
  size?: ActionColumnSize
  children: ReactNode
  contentClassName?: string
}

/** Centers single or grouped row actions directly below the action header. */
export function EnterpriseTableActionCell({
  size = 'default',
  className,
  contentClassName,
  children,
  ...props
}: EnterpriseTableActionCellProps) {
  return (
    <td
      className={cn('px-4 py-4 align-middle', actionColumnWidths[size], className)}
      {...props}
    >
      <div className={cn('flex w-full items-center justify-center gap-2 whitespace-nowrap', contentClassName)}>
        {children}
      </div>
    </td>
  )
}
