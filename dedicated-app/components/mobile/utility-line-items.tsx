'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import {
  createExpenseLineItem,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import { UTILITY_FORM_OPTIONS } from '@/lib/form-options'
import { useLocale, useLocaleFormatters, useTranslations, utilityTypeLabel } from '@/lib/i18n'

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
  const { locale } = useLocale()
  const t = useTranslations('expenses')
  const format = useLocaleFormatters()
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
              <span className="text-label font-bold text-[#123748]">{t('utilityNumber', { number: format.number(index + 1) })}</span>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}
                  disabled={disabled}
                  className="grid h-9 w-9 place-items-center rounded-[11px] text-[#d92d20] transition active:bg-[#fff0f0] disabled:opacity-50"
                  aria-label={t('removeUtility', { number: format.number(index + 1) })}
                >
                  <Trash2 size={17} />
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DesignedSelect
                label={t('type')}
                icon={expenseFormIcons.category}
                value={selectedType}
                onChange={(event) => update(item.id, { itemName: event.target.value })}
              >
                {UTILITY_FORM_OPTIONS.map((option) => (
                  <option key={option.utilityType} value={option.label}>
                    {utilityTypeLabel(option.utilityType, locale)}
                  </option>
                ))}
              </DesignedSelect>
              <DesignedInput
                label={t('price')}
                icon={expenseFormIcons.amount}
                value={item.amount}
                onChange={(event) => update(item.id, { amount: event.target.value })}
                placeholder={t('enterPrice')}
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
        <Plus size={17} /> {t('addMore')}
      </button>

      <div className="flex items-center justify-between rounded-[14px] bg-[#e8f8f7] px-4 py-3">
        <div>
          <span className="block text-caption font-semibold text-[#65838b]">{t('utilityTotal')}</span>
          <span className="mt-0.5 block text-label font-bold text-[#123748]">
            {t(items.length === 1 ? 'utilityCount' : 'utilitiesCount', { count: format.number(items.length) })}
          </span>
        </div>
        <span className="text-title-sm font-bold text-[#00777a]">{format.money(total)}</span>
      </div>
    </div>
  )
}
