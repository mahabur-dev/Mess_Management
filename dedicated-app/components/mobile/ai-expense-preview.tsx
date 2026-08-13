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
  items?: Array<{
    itemName: string
    quantity?: number | null
    unit?: string | null
    amount: number
  }>
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

function initialPreviewValue(value: unknown): SplitPreview | null {
  if (value && !Array.isArray(value) && typeof value === 'object') return value as SplitPreview
  return null
}

export function AiExpensePreview({
  intent,
  payload,
  items,
  initialPreview,
  members,
  currentUserId,
  canManage,
  disabled,
  onPatchPayload,
  onPatchItem,
  onRemoveItem,
}: {
  intent: 'EXPENSE_CREATE' | 'UTILITY_CREATE'
  payload: AiExpensePreviewItem
  items: AiExpensePreviewItem[]
  initialPreview: unknown
  members: MemberOption[]
  currentUserId?: string
  canManage: boolean
  disabled?: boolean
  onPatchPayload: (patch: Record<string, unknown>) => void
  onPatchItem: (index: number, patch: Record<string, unknown>) => void
  onRemoveItem: (index: number) => void
}) {
  const isUtility = intent === 'UTILITY_CREATE'
  const primary = payload
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
  const [preview, setPreview] = useState<SplitPreview | null>(() => initialPreviewValue(initialPreview))
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewMessage, setPreviewMessage] = useState('')

  const invalidatePreview = () => {
    setPreview(null)
    setPreviewMessage('Details changed. Update the split preview to see the new member allocation.')
  }

  const patchItem = (index: number, patch: Record<string, unknown>) => {
    invalidatePreview()
    onPatchItem(index, patch)
  }

  const patchAll = (patch: Record<string, unknown>) => {
    invalidatePreview()
    onPatchPayload(patch)
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
      const response = await api.previewExpense(payload)
      setPreview(response.data as SplitPreview)
    } catch (error) {
      setPreview(null)
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

      <FormSection title={isUtility ? 'Utility Details' : 'Expense Details'}>
        {isUtility ? (
          <DesignedSelect
            label="Utility Type"
            icon={expenseFormIcons.category}
            value={String(primary.utilityType ?? 'OTHER')}
            onChange={(event) => {
              const option = UTILITY_FORM_OPTIONS.find((candidate) => candidate.utilityType === event.target.value) ?? UTILITY_FORM_OPTIONS[0]
              patchAll({ utilityType: option.utilityType, category: option.category })
            }}
          >
            {UTILITY_FORM_OPTIONS.map((option) => <option key={option.utilityType} value={option.utilityType}>{option.label}</option>)}
          </DesignedSelect>
        ) : (
          <DesignedSelect
            label="Category"
            icon={expenseFormIcons.category}
            value={String(primary.category ?? 'OTHER')}
            onChange={(event) => patchAll({ category: event.target.value })}
          >
            {GENERAL_EXPENSE_CATEGORIES.map((option) => <option key={option} value={option}>{LABELS.EXPENSE_CATEGORIES[option]}</option>)}
          </DesignedSelect>
        )}
        <FormFieldGrid>
          <DesignedInput
            label={isUtility ? 'Bill Date' : 'Expense Date'}
            icon={expenseFormIcons.date}
            value={String(primary.expenseDate ?? '')}
            onChange={(event) => patchAll({ expenseDate: event.target.value })}
            type="date"
            required
          />
          <DesignedInput
            label="Billing Month"
            icon={expenseFormIcons.date}
            value={monthValue(primary)}
            onChange={(event) => patchAll({ billingMonth: event.target.value ? `${event.target.value}-01` : undefined })}
            type="month"
            required
          />
        </FormFieldGrid>
        <DesignedTextarea
          label="Note (Optional)"
          icon={expenseFormIcons.description}
          value={String(primary.description ?? '')}
          onChange={(event) => patchAll({ description: event.target.value.slice(0, 250) })}
          placeholder="Add a note"
          count={`${String(primary.description ?? '').length}/250`}
        />
      </FormSection>

      {items.map((item, index) => (
          <FormSection key={index} title={`Purchased Item ${index + 1}`}>
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

            <DesignedInput
              label="Item"
              icon={expenseFormIcons.item}
              value={String(item.itemName ?? '')}
              onChange={(event) => patchItem(index, { itemName: event.target.value })}
              placeholder="Expense item"
              required
            />
            <FormFieldGrid>
              <DesignedInput
                label="Quantity (Optional)"
                icon={expenseFormIcons.item}
                value={String(item.quantity ?? '')}
                onChange={(event) => patchItem(index, { quantity: event.target.value === '' ? null : Number(event.target.value) })}
                placeholder="0"
                type="number"
                min="0"
              />
              <DesignedInput
                label="Unit (Optional)"
                icon={expenseFormIcons.item}
                value={String(item.unit ?? '')}
                onChange={(event) => patchItem(index, { unit: event.target.value })}
                placeholder="kg"
              />
            </FormFieldGrid>

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
          </FormSection>
      ))}

      <FormSection title="Split Preview">
        {preview ? (
          <div className="overflow-hidden rounded-[16px] border border-[#e4eaec] bg-[#f8fdfd] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-label font-bold text-[#123748]">{preview.title || 'Expense total'}</p>
                    <p className="mt-0.5 text-caption font-semibold text-[#65838b]">
                      {LABELS.EXPENSE_USED_BY[preview.usedBy ?? usedBy]} · {LABELS.EXPENSE_SPLIT_METHODS[preview.splitMethod ?? splitMethod]}
                    </p>
                  </div>
                  <span className="shrink-0 text-body font-bold text-[#00777a]">{formatTaka(preview.amount ?? 0)}</span>
                </div>
                <div className="mb-3 overflow-hidden rounded-[12px] border border-[#e4eaec] bg-white">
                  {(preview.items ?? []).map((item, index) => (
                    <div key={`${item.itemName}-${index}`} className="flex items-center justify-between gap-3 border-b border-[#edf1f4] px-3 py-2.5 last:border-b-0">
                      <span className="min-w-0 truncate text-label font-semibold text-[#123748]">{item.itemName}</span>
                      <span className="shrink-0 text-label font-bold text-[#00777a]">{formatTaka(item.amount)}</span>
                    </div>
                  ))}
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
        ) : (
          <div className="rounded-[15px] border border-[#f5dfab] bg-[#fff8e9] px-3.5 py-3 text-label font-semibold text-[#7a5a13]">
            {previewMessage || 'Calculate the split to check exactly which members will be charged.'}
          </div>
        )}
        <ExpensePrimaryAction onClick={() => void refreshPreview()} disabled={disabled || previewBusy}>
          <Eye size={17} /> {previewBusy ? 'Calculating...' : preview ? 'Recalculate Split' : 'Update Split Preview'}
        </ExpensePrimaryAction>
        <FormStatusMessage message={preview ? previewMessage : ''} />
      </FormSection>
    </div>
  )
}
