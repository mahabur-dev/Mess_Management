'use client'

import { useRef } from 'react'
import { useTranslations } from '@/lib/i18n'
import { useDialogFocus } from '@/hooks/use-dialog-focus'

export function LogoutConfirmDialog({
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const common = useTranslations('common')
  const auth = useTranslations('auth')
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useDialogFocus({
    open,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onClose: () => {
      if (!busy) onCancel()
    },
  })
  if (!open) return null

  return (
    <div
      ref={dialogRef}
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-[#062b35]/35
        p-4
      "
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      aria-describedby={busy ? 'logout-confirm-status' : undefined}
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel()
        }
      }}
    >
      <section
        className="
          relative w-full max-w-[360px]
          overflow-hidden rounded-[16px]
          border border-[#dce5e7]
          bg-white
          p-4
          shadow-[0_18px_48px_rgba(18,55,72,0.16)]
        "
      >
        <h2
          id="logout-confirm-title"
          className="px-1 py-1 text-center text-title-sm font-semibold text-[#123748]"
        >
          {auth('logoutQuestion')}
        </h2>

        {busy ? (
          <p
            id="logout-confirm-status"
            className="mt-2 text-center text-caption font-semibold leading-5 text-[#008d8c]"
            role="status"
            aria-live="polite"
          >
            {auth('signingOut')}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="
              flex h-11 min-h-11 w-full items-center justify-center rounded-[10px]
              border border-[#cfdadd]
              bg-white
              text-label font-semibold text-[#415f68]
              transition-colors duration-150
              hover:border-[#9ab7bc]
              hover:bg-[#f7f9f9]
              active:scale-[0.98]
              leading-none
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {common('no')}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="
              flex h-11 items-center justify-center rounded-[10px]
              border border-[#008d8c]
              bg-[#008d8c]
              px-3 text-label font-semibold
              text-white
              transition-colors duration-150
              hover:bg-[#007c7c]
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
          >
            {common('yes')}
          </button>
        </div>
      </section>
    </div>
  )
}
