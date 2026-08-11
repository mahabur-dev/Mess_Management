'use client'

import { useState } from 'react'
import { Eye, ReceiptText, Trash2, Zap } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormFieldGrid,
  FormSection,
  FormStatusMessage,
  FormSummaryCard,
  PaymentTypeSelector,
  expenseFormIcons,
  formatTaka,
} from '@/components/mobile/expense-design'
import {
  ExpensePrimaryAction,
  ExpenseSplitMethodSelector,
  ExpenseUsedBySelector,
  MemberAllocationList,
} from '@/components/mobile/expense-ui'
import {
  ExpenseCustomShareFields,
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import { api } from '@/lib/api'
import {
  EXPENSE_PAYMENT_TYPES,
  EXPENSE_SPLIT_METHODS,
  EXPENSE_USED_BY,
  GENERAL_EXPENSE_CATEGORIES,
  LABELS,
  UTILITY_FORM_OPTIONS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'

export type AiExpensePreviewItem = Record<string, unknown>

type SplitShare = {
  memberId: string
  memberName?: string | null
  shareAmount: number
  isPayer?: boolean
}

type SplitPreview = {
  title?: string
  amount?: number
  paidFrom?: string
  paymentType?: ExpensePaymentType
  usedBy?: ExpenseUsedBy
  splitMethod?: ExpenseSplitMethod
  payerCredit?: number
  totalSharedCost?: number
  shares?: SplitShare[]
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T)
}

function paymentTypeOf(item: AiExpensePreviewItem): ExpensePaymentType {
  const value = item.paymentType ?? item.paidFrom
  if (value === 'MESS_DEPOSIT') return 'FROM_DEPOSIT'
  return isOneOf(value, EXPENSE_PAYMENT_TYPES) ? value : 'FROM_DEPOSIT'
}

function usedByOf(item: AiExpensePreviewItem): ExpenseUsedBy {
  return isOneOf(item.usedBy, EXPENSE_USED_BY) ? item.usedBy : 'ALL_MEMBERS'
}

function splitMethodOf(item: AiExpensePreviewItem): ExpenseSplitMethod {
  return isOneOf(item.splitMethod, EXPENSE_SPLIT_METHODS) ? item.splitMethod : 'EQUAL'
}

function selectedMemberIdsOf(item: AiExpensePreviewItem) {
  return Array.isArray(item.selectedMemberIds)
    ? item.selectedMemberIds.filter((value): value is string => typeof value === 'string')
    : []
}

function customSharesOf(item: AiExpensePreviewItem): ExpenseCustomShare[] {
  if (!Array.isArray(item.customShares)) return []
  return item.customShares.flatMap((share) => {
    if (!share || typeof share !== 'object') return []
    const candidate = share as Record<string, unknown>
    if (typeof candidate.memberId !== 'string') return []
    return [{ memberId: candidate.memberId, amount: String(candidate.amount ?? '') }]
  })
}

function monthValue(item: AiExpensePreviewItem) {
  const billingMonth = typeof item.billingMonth === 'string' ? item.billingMonth : ''
  const expenseDate = typeof item.expenseDate === 'string' ? item.expenseDate : ''
  return (billingMonth || expenseDate).slice(0, 7)
}

function initialPreviews(value: unknown, itemCount: number): SplitPreview[] | null {
  if (Array.isArray(value)) {
    const previews = value.filter((item): item is SplitPreview => Boolean(item && typeof item === 'object'))
    return previews.length === itemCount ? previews : null
  }
  if (value && typeof value === 'object' && itemCount === 1) return [value as SplitPreview]
  return null
}

export function AiExpensePreview({
  intent,
  items,
  initialPreview,
  members,
  currentUserId,
  canManage,
  disabled,
  onPatchItem,
  onRemoveItem,
}: {
  intent: 'EXPENSE_CREATE' | 'UTILITY_CREATE'
  items: AiExpensePreviewItem[]
  initialPreview: unknown
  members: MemberOption[]
  currentUserId?: string
  canManage: boolean
  disabled?: boolean
  onPatchItem: (index: number, patch: Record<string, unknown>) => void
  onRemoveItem: (index: number) => void
}) {
  const isUtility = intent === 'UTILITY_CREATE'
  const primary = items[0] ?? {}
  const paymentType = paymentTypeOf(primary)
  const usedBy = usedByOf(primary)
  const splitMethod = splitMethodOf(primary)
  const selectedMemberIds = selectedMemberIdsOf(primary)
  const customShares = customSharesOf(primary)
  const selectedMembers =
    usedBy === 'SELECTED_MEMBERS'
      ? selectedMemberIds
      : usedBy === 'SELF_ONLY'
        ? currentUserId
          ? [currentUserId]
          : []
        : members.map((member) => member.id)
  const [previews, setPreviews] = useState<SplitPreview[] | null>(() => initialPreviews(initialPreview, items.length))
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewMessage, setPreviewMessage] = useState('')

  const invalidatePreview = () => {
    setPreviews(null)
    setPreviewMessage('Details changed. Update the split preview to see the new member allocation.')
  }

  const patchItem = (index: number, patch: Record<string, unknown>) => {
    invalidatePreview()
    onPatchItem(index, patch)
  }

  const patchAll = (patch: Record<string, unknown>) => {
    invalidatePreview()
    items.forEach((_item, index) => onPatchItem(index, patch))
  }

  const removeItem = (index: number) => {
    invalidatePreview()
    onRemoveItem(index)
  }

  const updatePaymentType = (value: ExpensePaymentType) => {
    patchAll({
      paymentType: value,
      paidFrom: value === 'FROM_DEPOSIT' ? 'MESS_DEPOSIT' : value,
    })
  }

  const updateUsedBy = (value: ExpenseUsedBy) => {
    const patch: Record<string, unknown> = { usedBy: value }
    if (value === 'SELF_ONLY') patch.splitMethod = 'EQUAL'
    if (value === 'MEAL_ON_MEMBERS' && splitMethod === 'CUSTOM') patch.splitMethod = 'MEAL_COUNT'
    patchAll(patch)
  }

  const refreshPreview = async () => {
    setPreviewBusy(true)
    setPreviewMessage('')
    try {
      const responses = await Promise.all(items.map((item) => api.previewExpense(item)))
      setPreviews(responses.map((response) => response.data as SplitPreview))
    } catch (error) {
      setPreviews(null)
      setPreviewMessage(error instanceof Error ? error.message : 'Failed to calculate the split preview.')
    } finally {
      setPreviewBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FormSummaryCard
        eyebrow="AI Preview"
        title={isUtility ? 'Review utility before saving' : 'Review expense before saving'}
        description={`${items.length} ${items.length === 1 ? 'item' : 'items'} · Edit anything that AI misunderstood`}
        icon={isUtility ? Zap : ReceiptText}
      />

      <FormSection title="Paid From">
        <PaymentTypeSelector value={paymentType} onChange={updatePaymentType} showHeading={false} />
      </FormSection>

      <FormSection title="Used By">
        <ExpenseUsedBySelector value={usedBy} onChange={updateUsedBy} />
        {usedBy === 'SELECTED_MEMBERS' ? (
          <MemberMultiSelect
            members={members}
            selected={selectedMemberIds}
            onChange={(selectedMemberIds) => patchAll({ selectedMemberIds })}
          />
        ) : null}
      </FormSection>

      {usedBy !== 'SELF_ONLY' ? (
        <FormSection title="Split Method">
          <ExpenseSplitMethodSelector
            value={splitMethod}
            onChange={(value) => patchAll({ splitMethod: value })}
            allowCustom={usedBy !== 'MEAL_ON_MEMBERS'}
          />
          {splitMethod === 'CUSTOM' ? (
            <ExpenseCustomShareFields
              members={members}
              memberIds={selectedMembers}
              shares={customShares}
              onChange={(shares) => patchAll({ customShares: shares })}
            />
          ) : null}
        </FormSection>
      ) : null}

      {canManage ? (
        <FormSection title={paymentType === 'PERSONAL' ? 'Paid By' : 'Purchased By'}>
          <DesignedSelect
            label={paymentType === 'PERSONAL' ? 'Paid By' : 'Purchased By'}
            icon={expenseFormIcons.member}
            value={String(primary.purchasedBy ?? '')}
            onChange={(event) => patchAll({ purchasedBy: event.target.value || undefined })}
            required={paymentType === 'PERSONAL'}
          >
            <option value="">Select member</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </DesignedSelect>
        </FormSection>
      ) : null}

      {items.map((item, index) => {
        const category = String(item.category ?? (isUtility ? 'ELECTRICITY' : 'OTHER')) as ExpenseCategory
        const utilityType = String(item.utilityType ?? 'OTHER')
        const description = String(item.description ?? '')
        return (
          <FormSection key={index} title={isUtility ? `Utility Details${items.length > 1 ? ` ${index + 1}` : ''}` : `Expense Details${items.length > 1 ? ` ${index + 1}` : ''}`}>
            {items.length > 1 ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={disabled}
                  className="ui-btn ui-btn--ghost ui-btn--sm text-[#ee1f2f]"
                >
                  <Trash2 size={15} /> Remove item
                </button>
              </div>
            ) : null}

            {isUtility ? (
              <DesignedSelect
                label="Utility Type"
                icon={expenseFormIcons.category}
                value={utilityType}
                onChange={(event) => {
                  const option = UTILITY_FORM_OPTIONS.find((candidate) => candidate.utilityType === event.target.value) ?? UTILITY_FORM_OPTIONS[0]
                  patchItem(index, { utilityType: option.utilityType, category: option.category, itemName: option.label })
                }}
              >
                {UTILITY_FORM_OPTIONS.map((option) => <option key={option.utilityType} value={option.utilityType}>{option.label}</option>)}
              </DesignedSelect>
            ) : (
              <FormFieldGrid>
                <DesignedSelect
                  label="Category"
                  icon={expenseFormIcons.category}
                  value={category}
                  onChange={(event) => patchItem(index, { category: event.target.value })}
                >
                  {GENERAL_EXPENSE_CATEGORIES.map((option) => <option key={option} value={option}>{LABELS.EXPENSE_CATEGORIES[option]}</option>)}
                </DesignedSelect>
                <DesignedInput
                  label="Item"
                  icon={expenseFormIcons.item}
                  value={String(item.itemName ?? '')}
                  onChange={(event) => patchItem(index, { itemName: event.target.value })}
                  placeholder="Expense item"
                />
              </FormFieldGrid>
            )}

            {!isUtility && (category === 'FOOD' || category === 'GROCERY') ? (
              <FormFieldGrid>
                <DesignedInput
                  label="Quantity (Optional)"
                  icon={expenseFormIcons.item}
                  value={String(item.quantity ?? '')}
                  onChange={(event) => patchItem(index, { quantity: event.target.value === '' ? null : Number(event.target.value) })}
                  placeholder="0"
                  type="number"
                />
                <DesignedInput
                  label="Unit (Optional)"
                  icon={expenseFormIcons.item}
                  value={String(item.unit ?? '')}
                  onChange={(event) => patchItem(index, { unit: event.target.value })}
                  placeholder="kg"
                />
              </FormFieldGrid>
            ) : null}

            <DesignedInput
              label="Amount"
              icon={expenseFormIcons.amount}
              value={String(item.amount ?? '')}
              onChange={(event) => patchItem(index, { amount: event.target.value === '' ? '' : Number(event.target.value) })}
              placeholder="Enter amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />

            <FormFieldGrid>
              <DesignedInput
                label={isUtility ? 'Bill Date' : 'Expense Date'}
                icon={expenseFormIcons.date}
                value={String(item.expenseDate ?? '')}
                onChange={(event) => patchItem(index, { expenseDate: event.target.value })}
                type="date"
                required
              />
              <DesignedInput
                label="Billing Month"
                icon={expenseFormIcons.date}
                value={monthValue(item)}
                onChange={(event) => patchItem(index, { billingMonth: event.target.value ? `${event.target.value}-01` : undefined })}
                type="month"
                required
              />
            </FormFieldGrid>

            <DesignedTextarea
              label="Note (Optional)"
              icon={expenseFormIcons.description}
              value={description}
              onChange={(event) => patchItem(index, { description: event.target.value.slice(0, 250) })}
              placeholder="Add a note"
              count={`${description.length}/250`}
            />
          </FormSection>
        )
      })}

      <FormSection title="Split Preview">
        {previews ? (
          <div className="space-y-3">
            {previews.map((preview, index) => (
              <div key={index} className="overflow-hidden rounded-[16px] border border-[#e4eaec] bg-[#f8fdfd] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-label font-bold text-[#123748]">{preview.title || String(items[index]?.itemName ?? `Item ${index + 1}`)}</p>
                    <p className="mt-0.5 text-caption font-semibold text-[#65838b]">
                      {LABELS.EXPENSE_USED_BY[preview.usedBy ?? usedBy]} · {LABELS.EXPENSE_SPLIT_METHODS[preview.splitMethod ?? splitMethod]}
                    </p>
                  </div>
                  <span className="shrink-0 text-body font-bold text-[#00777a]">{formatTaka(preview.amount ?? Number(items[index]?.amount ?? 0))}</span>
                </div>
                <MemberAllocationList shares={preview.shares ?? []} formatMoney={formatTaka} amountLabel="Share" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] bg-white px-3 py-2">
                    <span className="block text-caption font-semibold text-[#65838b]">Payer Credit</span>
                    <span className="mt-1 block text-label font-bold text-[#15953a]">{formatTaka(preview.payerCredit ?? 0)}</span>
                  </div>
                  <div className="rounded-[12px] bg-white px-3 py-2">
                    <span className="block text-caption font-semibold text-[#65838b]">Shared Cost</span>
                    <span className="mt-1 block text-label font-bold text-[#00777a]">{formatTaka(preview.totalSharedCost ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[15px] border border-[#f5dfab] bg-[#fff8e9] px-3.5 py-3 text-label font-semibold text-[#7a5a13]">
            {previewMessage || 'Calculate the split to check exactly which members will be charged.'}
          </div>
        )}
        <ExpensePrimaryAction onClick={() => void refreshPreview()} disabled={disabled || previewBusy}>
          <Eye size={17} /> {previewBusy ? 'Calculating...' : previews ? 'Recalculate Split' : 'Update Split Preview'}
        </ExpensePrimaryAction>
        <FormStatusMessage message={previews ? previewMessage : ''} />
      </FormSection>
    </div>
  )
}
