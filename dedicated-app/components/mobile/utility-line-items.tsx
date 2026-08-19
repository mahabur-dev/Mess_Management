'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  expenseFormIcons,
  formatTaka,
} from '@/components/mobile/expense-design'
import {
  createExpenseLineItem,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import { UTILITY_FORM_OPTIONS } from '@/lib/form-options'

export function utilityOptionForItemName(itemName: string) {
  const normalized = itemName.trim().toLowerCase()
  return UTILITY_FORM_OPTIONS.find(
    (option) =>
      option.label.toLowerCase() === normalized ||
      option.utilityType.toLowerCase() === normalized,
  )
}

export function utilityLineItemsPayload(items: ExpenseLineItem[]) {
  return items.map((item) => ({
    itemName: utilityOptionForItemName(item.itemName)?.label ?? 'Other',
    amount: Number(item.amount),
  }))
}

export function UtilityLineItemsEditor({
  items,
  onChange,
  disabled,
}: {
  items: ExpenseLineItem[]
  onChange: (items: ExpenseLineItem[]) => void
  disabled?: boolean
}) {
  const total = Number(
    items
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      .toFixed(2),
  )

  const update = (id: string, patch: Partial<ExpenseLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const selectedType = utilityOptionForItemName(item.itemName)?.label ?? 'Other'

        return (
          <div key={item.id} className="rounded-[16px] border border-[#dce8ea] bg-[#fbfefe] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-label font-bold text-[#123748]">Utility {index + 1}</span>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}
                  disabled={disabled}
                  className="grid h-9 w-9 place-items-center rounded-[11px] text-[#d92d20] transition active:bg-[#fff0f0] disabled:opacity-50"
                  aria-label={`Remove utility ${index + 1}`}
                >
                  <Trash2 size={17} />
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DesignedSelect
                label="Type"
                icon={expenseFormIcons.category}
                value={selectedType}
                onChange={(event) => update(item.id, { itemName: event.target.value })}
              >
                {UTILITY_FORM_OPTIONS.map((option) => (
                  <option key={option.utilityType} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </DesignedSelect>
              <DesignedInput
                label="Price"
                icon={expenseFormIcons.amount}
                value={item.amount}
                onChange={(event) => update(item.id, { amount: event.target.value })}
                placeholder="Enter price"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange([
          ...items,
          createExpenseLineItem({ itemName: 'Electricity' }),
        ])}
        disabled={disabled || items.length >= 100}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#58bfc0] bg-[#f6ffff] text-label font-bold text-[#00777a] transition active:scale-[0.99] disabled:opacity-50"
      >
        <Plus size={17} /> Add More
      </button>

      <div className="flex items-center justify-between rounded-[14px] bg-[#e8f8f7] px-4 py-3">
        <div>
          <span className="block text-caption font-semibold text-[#65838b]">Utility total</span>
          <span className="mt-0.5 block text-label font-bold text-[#123748]">
            {items.length} {items.length === 1 ? 'utility' : 'utilities'}
          </span>
        </div>
        <span className="text-title-sm font-bold text-[#00777a]">{formatTaka(total)}</span>
      </div>
    </div>
  )
}
