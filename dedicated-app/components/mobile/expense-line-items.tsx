'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  DesignedInput,
  FormFieldGrid,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { useLocaleFormatters, useTranslations } from '@/lib/i18n'

export type ExpenseLineItem = {
  id: string
  itemName: string
  quantity: string
  unit: string
  amount: string
}

export function createExpenseLineItem(
  initial: Partial<Omit<ExpenseLineItem, 'id'>> = {},
): ExpenseLineItem {
  return {
    id: crypto.randomUUID(),
    itemName: initial.itemName ?? '',
    quantity: initial.quantity ?? '',
    unit: initial.unit ?? '',
    amount: initial.amount ?? '',
  }
}

export function expenseLineItemsTotal(items: ExpenseLineItem[]) {
  return Number(
    items
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      .toFixed(2),
  )
}

export function expenseLineItemsPayload(items: ExpenseLineItem[]) {
  return items.map((item) => ({
    itemName: item.itemName.trim(),
    amount: Number(item.amount),
    quantity: item.quantity === '' ? undefined : Number(item.quantity),
    unit: item.unit.trim() || undefined,
  }))
}

export function ExpenseLineItemsEditor({
  items,
  onChange,
  disabled,
}: {
  items: ExpenseLineItem[]
  onChange: (items: ExpenseLineItem[]) => void
  disabled?: boolean
}) {
  const t = useTranslations('expenses')
  const format = useLocaleFormatters()
  const total = expenseLineItemsTotal(items)

  const update = (id: string, patch: Partial<ExpenseLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="rounded-[16px] border border-[#dce8ea] bg-[#fbfefe] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-label font-bold text-[#123748]">{t('item', { number: format.number(index + 1) })}</span>
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}
                disabled={disabled}
                className="grid h-9 w-9 place-items-center rounded-[11px] text-[#d92d20] transition active:bg-[#fff0f0] disabled:opacity-50"
                aria-label={t('removeItem', { number: format.number(index + 1) })}
              >
                <Trash2 size={17} />
              </button>
            ) : null}
          </div>

          <DesignedInput
            label={t('itemName')}
            icon={expenseFormIcons.item}
            value={item.itemName}
            onChange={(event) => update(item.id, { itemName: event.target.value })}
            placeholder={t('itemNamePlaceholder')}
            required
          />
          <FormFieldGrid>
            <DesignedInput
              label={t('quantityOptional')}
              icon={expenseFormIcons.item}
              value={item.quantity}
              onChange={(event) => update(item.id, { quantity: event.target.value })}
              placeholder="0"
              type="number"
              min="0"
              step="0.001"
            />
            <DesignedInput
              label={t('unitOptional')}
              icon={expenseFormIcons.item}
              value={item.unit}
              onChange={(event) => update(item.id, { unit: event.target.value })}
              placeholder="kg"
            />
          </FormFieldGrid>
          <DesignedInput
            label={t('lineAmount')}
            icon={expenseFormIcons.amount}
            value={item.amount}
            onChange={(event) => update(item.id, { amount: event.target.value })}
            placeholder={t('lineAmountPlaceholder')}
            type="number"
            min="0.01"
            step="0.01"
            required
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, createExpenseLineItem()])}
        disabled={disabled || items.length >= 100}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#58bfc0] bg-[#f6ffff] text-label font-bold text-[#00777a] transition active:scale-[0.99] disabled:opacity-50"
      >
        <Plus size={17} /> {t('addAnotherItem')}
      </button>

      <div className="flex items-center justify-between rounded-[14px] bg-[#e8f8f7] px-4 py-3">
        <div>
          <span className="block text-caption font-semibold text-[#65838b]">{t('purchaseTotal')}</span>
          <span className="mt-0.5 block text-label font-bold text-[#123748]">{t(items.length === 1 ? 'itemCount' : 'itemsCount', { count: format.number(items.length) })}</span>
        </div>
        <span className="text-title-sm font-bold text-[#00777a]">{format.money(total)}</span>
      </div>
    </div>
  )
}
