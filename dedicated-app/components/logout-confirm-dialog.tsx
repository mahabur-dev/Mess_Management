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
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="app-modal">
        <button type="button" className="app-modal-close" onClick={onCancel} aria-label="Close logout confirmation">
          <X size={17} />
        </button>

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edfafa] text-[#008d8c]">
          <LogOut size={22} />
        </div>

        <h2 id="logout-confirm-title" className="mt-4 text-center text-lg font-black text-[#123748]">
          Logout korte chan?
        </h2>
        <p className="mx-auto mt-2 max-w-[260px] text-center text-sm leading-6 text-[#65838b]">
          Yes dile apnar session logout hoye jabe. No dile app-er moddhei thakben.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="app-modal-secondary" onClick={onCancel} disabled={busy}>
            No
          </button>
          <button type="button" className="app-modal-primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Logging out...' : 'Yes'}
          </button>
        </div>
      </section>
    </div>
  )
}
