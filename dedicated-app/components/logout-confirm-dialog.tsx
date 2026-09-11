'use client'

import { useRef } from 'react'
import { LogOut } from 'lucide-react'
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
        flex items-end justify-center
        bg-[#062b35]/35
        p-3 sm:p-4
        sm:items-center
      "
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-description"
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel()
        }
      }}
    >
      <section
        className="
          relative w-full max-w-[380px]
          overflow-hidden rounded-[20px]
          border border-[#cfe7e6]
          bg-white
          px-5 pb-5 pt-7
        "
      >
        <div
          className="
            mx-auto grid h-16 w-16
            place-items-center rounded-[18px]
            border border-[#bfe4e2]
            bg-[#e8f8f7]
            text-[#007c7c]
          "
        >
          <LogOut size={26} strokeWidth={2.3} />
        </div>

        <h2
          id="logout-confirm-title"
          className="mt-5 text-center text-title font-bold text-[#123748]"
        >
          {auth('logoutQuestion')}
        </h2>

        <p id="logout-confirm-description" className="mx-auto mt-2 max-w-[300px] text-center text-body leading-6 text-[#65838b]">
          {auth('logoutDescription')}
        </p>

        <p
          className="mt-4 h-5 overflow-hidden text-center text-caption font-semibold leading-5 text-[#008d8c]"
          role="status"
          aria-live="polite"
        >
          {busy ? auth('signingOut') : '\u00A0'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="
              flex h-12 min-h-12 w-full items-center justify-center rounded-[15px]
              border border-[#bfe1e0]
              bg-[#f5fbfb]
              text-label font-extrabold text-[#007c7c]
              transition-all duration-200
              hover:border-[#008d8c]
              hover:bg-[#e9f8f7]
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
              flex h-12 items-center justify-center gap-2 rounded-[15px]
              border border-[#007c7c]
              bg-[#008d8c]
              px-3 text-label font-extrabold
              text-white
              transition-all duration-200
              hover:bg-[#007c7c]
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
          >
            <LogOut size={17} className="shrink-0" strokeWidth={2.3} />

            {common('yes')}
          </button>
        </div>
      </section>
    </div>
  )
}
