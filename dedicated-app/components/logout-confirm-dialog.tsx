'use client'

import { LogOut, X } from 'lucide-react'

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
  if (!open) return null

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-end justify-center
        bg-[#062b35]/35
        p-4
        backdrop-blur-[3px]
        sm:items-center
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel()
        }
      }}
    >
      <section
        className="
          relative w-full max-w-[360px]
          rounded-[24px]
          border border-[#d7e8e8]
          bg-white
          px-5 pb-5 pt-6
          shadow-[0_24px_70px_rgba(6,43,53,0.22)]
        "
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close logout confirmation"
          className="
            absolute right-4 top-4
            grid h-9 w-9
            place-items-center rounded-full
            text-[#71878d]
            transition-colors
            hover:bg-[#f0f8f8]
            hover:text-[#008d8c]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#008d8c]/20
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <div
          className="
            mx-auto grid h-14 w-14
            place-items-center rounded-2xl
            border border-[#cce8e7]
            bg-[#edfafa]
            text-[#008d8c]
          "
        >
          <LogOut size={24} strokeWidth={2.2} />
        </div>

        <h2
          id="logout-confirm-title"
          className="mt-4 text-center text-title font-semibold text-[#1d3a42]"
        >
          Log out of Messzen?
        </h2>

        <p className="mx-auto mt-2 max-w-[280px] text-center text-body text-[#65838b]">
          You will need to sign in again to access your account.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="
              flex h-12 items-center justify-center
              rounded-[14px]
              border border-[#d7e8e8]
              bg-white
              text-label font-bold
              text-[#47636b]
              transition-all duration-200
              hover:border-[#9ed5d3]
              hover:bg-[#f7fbfb]
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="
              flex h-12 items-center justify-center
              gap-2 rounded-[14px]
              bg-[#008d8c]
              px-3
              text-label font-bold
              text-white
              shadow-[0_10px_24px_rgba(0,141,140,0.22)]
              transition-all duration-200
              hover:bg-[#007c7c]
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
          >
            <LogOut size={17} strokeWidth={2.3} />

            {busy ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </section>
    </div>
  )
}
