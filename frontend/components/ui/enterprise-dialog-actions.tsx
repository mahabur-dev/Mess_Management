'use client'

import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

import { DialogFooter } from '@/components/ui/dialog'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface EnterpriseDialogActionsProps {
  onCancel: () => void
  onConfirm: () => void
  cancelLabel?: ReactNode
  confirmLabel?: ReactNode
  pendingLabel?: ReactNode
  confirmIcon?: ReactNode
  confirmTone?: 'primary' | 'danger' | 'success' | 'warning'
  pending?: boolean
  disabled?: boolean
  className?: string
}

/** Consistent, localized action row for modal workflows. */
export function EnterpriseDialogActions({
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  pendingLabel,
  confirmIcon,
  confirmTone = 'primary',
  pending = false,
  disabled = false,
  className,
}: EnterpriseDialogActionsProps) {
  const common = useTranslations('common')

  return (
    <DialogFooter className={cn('pt-2', className)}>
      <EnterpriseButton tone="secondary" onClick={onCancel} disabled={pending}>
        {cancelLabel ?? common('cancel')}
      </EnterpriseButton>
      <EnterpriseButton
        tone={confirmTone}
        onClick={onConfirm}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : confirmIcon}
        {pending
          ? pendingLabel ?? common('processing')
          : confirmLabel ?? common('confirm')}
      </EnterpriseButton>
    </DialogFooter>
  )
}
