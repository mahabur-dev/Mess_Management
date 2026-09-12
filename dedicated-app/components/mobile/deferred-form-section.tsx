'use client'

import type { ReactNode } from 'react'
import { useNativeBackAction } from '@/components/native-back-actions'
import { useTranslations } from '@/lib/i18n'

type DeferredFormSectionProps = {
  open: boolean
  title: string
  description: string
  actionLabel: string
  icon: ReactNode
  children: ReactNode
  onOpen: () => void
  onClose: () => void
}

export function DeferredFormSection({
  open,
  title,
  description,
  actionLabel,
  icon,
  children,
  onOpen,
  onClose,
}: DeferredFormSectionProps) {
  const t = useTranslations('common')
  useNativeBackAction(open, () => {
    onClose()
    return true
  })

  if (open) {
    return (
      <section className="app-section app-form-section space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-body font-semibold text-[#123748]">{title}</div>
            <div className="mt-1 text-caption font-medium text-[#65838b]">{description}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#edfafa] px-3 py-1.5 text-caption font-semibold text-[#008d8c]"
          >
            {t('close')}
          </button>
        </div>
        {children}
      </section>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="app-action-row flex w-full items-center gap-3 text-left transition active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#008d8c]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label font-semibold text-[#123748]">{actionLabel}</span>
        <span className="mt-1 block text-caption font-medium leading-relaxed text-[#65838b]">{description}</span>
      </span>
    </button>
  )
}
