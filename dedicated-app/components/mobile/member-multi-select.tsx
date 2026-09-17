'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight, Users, X } from 'lucide-react'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import { useNativeBackAction } from '@/components/native-back-actions'
import { useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { useDialogFocus } from '@/hooks/use-dialog-focus'

export function MemberMultiSelect({
  members,
  selected,
  onChange,
}: {
  members: MemberOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const t = useTranslations('expenses')
  const format = useLocaleFormatters()
  const [open, setOpen] = useState(false)
  const listId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const selectedSet = new Set(selected)
  const selectedLabel = selected.length
    ? t(selected.length === 1 ? 'selectedMemberCount' : 'selectedMembersCount', { count: format.number(selected.length) })
    : t('selectMembers')

  useEffect(() => {
    setOpen(true)
  }, [])

  useNativeBackAction(open, () => {
    setOpen(false)
    return true
  })

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useDialogFocus({ open, containerRef: dialogRef, initialFocusRef: closeButtonRef, onClose: () => setOpen(false) })

  function toggleMember(memberId: string) {
    onChange(
      selectedSet.has(memberId)
        ? selected.filter((id) => id !== memberId)
        : [...selected, memberId],
    )
  }

  return (
    <div>
      <button
        type="button"
        className="flex min-h-[54px] w-full items-center gap-3 rounded-[16px] border border-[#dce5ec] bg-white px-3.5 py-3 text-left shadow-[0_8px_20px_rgba(18,55,72,0.045)] transition-colors active:bg-[#edfafa]"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="dialog"
      >
        <span className="ui-icon-tile ui-icon-tile--md bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
          <Users size={18} strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-caption font-semibold text-[#65838b]">{t('members')}</span>
          <span className="mt-0.5 block truncate text-label font-semibold text-[#123748]">{selectedLabel}</span>
        </span>
        <ChevronRight size={19} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
      </button>

      {open && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-[#062b35]/35 backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false)
          }}
        >
          <section
            ref={dialogRef}
            id={listId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${listId}-title`}
            tabIndex={-1}
            className="relative w-full max-w-[480px] overflow-hidden rounded-t-[26px] border border-b-0 border-[#cfe7e6] bg-white shadow-[0_-20px_60px_rgba(6,43,53,0.22)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-3 border-b border-[#e4eaec] px-4 pb-3 pt-3">
              <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#cfdde0]" aria-hidden="true" />
              <span className="ui-icon-tile ui-icon-tile--md mt-2 bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
                <Users size={18} strokeWidth={2.3} />
              </span>
              <span className="mt-2 min-w-0 flex-1">
                <span id={`${listId}-title`} className="block text-body font-semibold text-[#123748]">{t('selectMembers')}</span>
                <span className="mt-0.5 block text-caption font-semibold text-[#65838b]">{selectedLabel}</span>
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                className="mt-2 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#00777a] active:scale-95"
                onClick={() => setOpen(false)}
                aria-label={t('closeMemberSelection')}
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </header>

            <div className="max-h-[min(55vh,420px)] overflow-y-auto overscroll-contain p-2">
              {members.length ? (
                members.map((member) => {
                  const active = selectedSet.has(member.id)

                  return (
                    <button
                      key={member.id}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      onClick={() => toggleMember(member.id)}
                      className={`flex min-h-[52px] w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                        active ? 'bg-[#edfafa]' : 'active:bg-[#f2f7f7]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-label font-semibold ${active ? 'text-[#00777a]' : 'text-[#123748]'}`}>
                          {member.name}
                        </span>
                        {member.email ? <span className="mt-0.5 block truncate text-caption font-medium text-[#65838b]">{member.email}</span> : null}
                      </span>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-[8px] border ${
                          active ? 'border-[#008d8c] bg-[#008d8c] text-white' : 'border-[#cfdde0] bg-white text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="px-3 py-5 text-center text-label font-semibold text-[#65838b]">{t('noMembersAvailable')}</div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[#e4eaec] bg-[#f8fdfd] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
              <span className="text-caption font-semibold text-[#65838b]">{selectedLabel}</span>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm min-w-[88px]" onClick={() => setOpen(false)}>
                {t('done')}
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
