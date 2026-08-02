'use client'

import { useId, useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'
import type { MemberOption } from '@/hooks/use-mess-member-options'

export function MemberMultiSelect({
  members,
  selected,
  onChange,
}: {
  members: MemberOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(true)
  const listId = useId()
  const selectedSet = new Set(selected)
  const selectedLabel = selected.length
    ? `${selected.length} ${selected.length === 1 ? 'member' : 'members'} selected`
    : 'Select members'

  function toggleMember(memberId: string) {
    onChange(
      selectedSet.has(memberId)
        ? selected.filter((id) => id !== memberId)
        : [...selected, memberId],
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#dce5ec] bg-white">
      <button
        type="button"
        className={`flex min-h-[54px] w-full items-center gap-3 px-3.5 py-3 text-left transition-colors ${
          open ? 'bg-[#f8fdfd]' : 'active:bg-[#edfafa]'
        }`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className="ui-icon-tile ui-icon-tile--md bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
          <Users size={18} strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-caption font-bold text-[#65838b]">Members</span>
          <span className="mt-0.5 block truncate text-label font-bold text-[#123748]">{selectedLabel}</span>
        </span>
        <ChevronDown
          size={19}
          className={`shrink-0 text-[#78a4a9] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div id={listId} className="border-t border-[#e4eaec]">
          <div className="max-h-60 overflow-y-auto overscroll-contain p-2">
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
                      <span className={`block truncate text-label font-bold ${active ? 'text-[#00777a]' : 'text-[#123748]'}`}>
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
              <div className="px-3 py-5 text-center text-label font-semibold text-[#65838b]">No members available.</div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#e4eaec] bg-[#f8fdfd] px-3 py-2.5">
            <span className="text-caption font-semibold text-[#65838b]">{selectedLabel}</span>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
