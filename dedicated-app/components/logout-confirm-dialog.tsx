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
        backdrop-blur-[3px]
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
          overflow-hidden rounded-[28px]
          border border-[#cfe7e6]
          bg-white
          px-5 pb-5 pt-7
          shadow-[0_24px_80px_rgba(6,43,53,0.28)]
        "
      >
        <div
          className="
            mx-auto grid h-16 w-16
            place-items-center rounded-[22px]
            border border-[#bfe4e2]
            bg-gradient-to-br from-[#e8fbfa] to-[#d5f3f1]
            text-[#007c7c]
            shadow-[0_10px_24px_rgba(0,141,140,0.12)]
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

        {busy ? <p className="mt-4 text-center text-caption font-semibold text-[#008d8c]">{auth('signingOut')}</p> : null}

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
              bg-gradient-to-r from-[#008d8c] to-[#007477]
              px-3 text-label font-extrabold
              text-white
              shadow-[0_10px_24px_rgba(0,119,122,0.24)]
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
