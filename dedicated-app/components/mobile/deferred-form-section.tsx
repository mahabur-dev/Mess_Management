'use client'

import type { ReactNode } from 'react'

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
  if (open) {
    return (
      <div className="glass space-y-4 rounded-[28px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-black text-[#123748]">{title}</div>
            <div className="mt-1 text-xs font-medium text-[#65838b]">{description}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#edfafa] px-3 py-1.5 text-xs font-black text-[#008d8c]"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass flex w-full items-center gap-3 rounded-[24px] p-4 text-left transition active:scale-[0.99]"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#008d8c] text-white shadow-[0_12px_24px_rgba(0,119,122,0.22)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#123748]">{actionLabel}</span>
        <span className="mt-1 block text-xs font-medium leading-relaxed text-[#65838b]">{description}</span>
      </span>
    </button>
  )
}
