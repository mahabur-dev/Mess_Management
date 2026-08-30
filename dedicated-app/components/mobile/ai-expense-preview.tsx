'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import {
  FormStatusMessage,
} from '@/components/mobile/expense-design'
import {
  ExpenseActionBar,
  ExpensePrimaryAction,
  ExpenseSecondaryAction,
  SplitPreviewContent,
} from '@/components/mobile/expense-ui'
import {
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { ExpenseEntryForm } from '@/components/mobile/expense-entry-form'
import type { ExpenseLineItem } from '@/components/mobile/expense-line-items'
import { utilityOptionForItemName } from '@/components/mobile/utility-line-items'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import { api } from '@/lib/api'
import {
  EXPENSE_PAYMENT_TYPES,
  EXPENSE_SPLIT_METHODS,
  EXPENSE_USED_BY,
  GENERAL_EXPENSE_CATEGORIES,
  UTILITY_FORM_OPTIONS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import {
  expensePaymentSourceLabel,
  expenseSplitMethodLabel,
  expenseUsedByLabel,
  useLocale,
  useLocaleFormatters,
  useLocalizedNotice,
  useTranslations,
} from '@/lib/i18n'

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

export function AiExpensePreview({
  intent,
  payload,
  items,
  members,
  canManage,
  disabled,
  onPatchPayload,
  onReplaceItems,
  onCancel,
  onConfirm,
}: {
  intent: 'EXPENSE_CREATE' | 'UTILITY_CREATE'
  payload: AiExpensePreviewItem
  items: AiExpensePreviewItem[]
  members: MemberOption[]
  canManage: boolean
  disabled?: boolean
  onPatchPayload: (patch: Record<string, unknown>) => void
  onReplaceItems: (items: Array<Record<string, unknown>>) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('expenses')
  const common = useTranslations('common')
  const previewNotice = useLocalizedNotice('expenses')
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
      : members.map((member) => member.id)
  const [preview, setPreview] = useState<SplitPreview | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedCustomized, setAdvancedCustomized] = useState(false)

  useEffect(() => {
    const patch: Record<string, unknown> = {}
    if (primary.billingMonth !== undefined) patch.billingMonth = undefined
    if (primary.usedBy !== undefined && !isOneOf(primary.usedBy, EXPENSE_USED_BY)) patch.usedBy = 'ALL_MEMBERS'
    if (isUtility && usedBy === 'MEAL_ON_MEMBERS') patch.usedBy = 'ALL_MEMBERS'
    if (isUtility && splitMethod === 'MEAL_COUNT') patch.splitMethod = 'EQUAL'
    if (Object.keys(patch).length) onPatchPayload(patch)
  }, [isUtility, onPatchPayload, primary.billingMonth, splitMethod, usedBy])

  const invalidatePreview = () => {
    setPreview(null)
    previewNotice.showMessage('detailsChanged', 'info')
  }

  const patchAll = (patch: Record<string, unknown>) => {
    invalidatePreview()
    onPatchPayload(patch)
  }

  const updatePaymentType = (value: ExpensePaymentType) => {
    patchAll({
      paymentType: value,
      paidFrom: value === 'FROM_DEPOSIT' ? 'MESS_DEPOSIT' : value,
    })
  }

  const updateUsedBy = (value: ExpenseUsedBy) => {
    const patch: Record<string, unknown> = { usedBy: value }
    if (value === 'MEAL_ON_MEMBERS' && splitMethod === 'CUSTOM') patch.splitMethod = 'MEAL_COUNT'
    patchAll(patch)
  }

  const refreshPreview = async () => {
    setPreviewBusy(true)
    previewNotice.clearNotice()
    try {
      const response = await api.previewExpense(payload)
      setPreview(response.data as SplitPreview)
    } catch (error) {
      setPreview(null)
      previewNotice.showError(error, 'previewFailed')
    } finally {
      setPreviewBusy(false)
    }
  }

  const category: ExpenseCategory = isOneOf(primary.category, GENERAL_EXPENSE_CATEGORIES)
    ? primary.category
    : 'OTHER'
  const utilityTypeOption = isUtility
    ? UTILITY_FORM_OPTIONS.find((option) => option.utilityType === primary.utilityType)
    : undefined
  const editorItems: ExpenseLineItem[] = (items.length ? items : [{}]).map((item, index) => {
    const itemName = String(item.itemName ?? '')
    return {
      id: `ai-expense-item-${index}`,
      itemName: isUtility
        ? utilityOptionForItemName(itemName)?.label ?? utilityTypeOption?.label ?? 'Other'
        : itemName,
      quantity: item.quantity == null ? '' : String(item.quantity),
      unit: String(item.unit ?? ''),
      amount: item.amount == null ? '' : String(item.amount),
    }
  })

  const replaceEditorItems = (nextItems: ExpenseLineItem[]) => {
    invalidatePreview()
    const nextPayloadItems = nextItems.map((item) => {
      const baseItem = {
        itemName: item.itemName,
        amount: item.amount === '' ? '' : Number(item.amount),
      }
      if (isUtility) return baseItem
      return {
        ...baseItem,
        quantity: item.quantity === '' ? undefined : Number(item.quantity),
        unit: item.unit.trim() || undefined,
      }
    })
    onReplaceItems(nextPayloadItems)
    if (isUtility) {
      const selectedOptions = nextItems
        .map((item) => utilityOptionForItemName(item.itemName))
        .filter((option) => option !== undefined)
      const utilityTypes = new Set(selectedOptions.map((option) => option.utilityType))
      const singleOption = utilityTypes.size === 1 ? selectedOptions[0] : undefined
      onPatchPayload({
        category: singleOption?.category ?? 'UTILITY',
        utilityType: singleOption?.utilityType ?? 'OTHER',
      })
    }
  }

  if (preview) {
    return (
      <SplitPreviewContent
        title={preview.title || (isUtility ? t('utilityTotal') : t('expenseTotal'))}
        amount={preview.amount ?? 0}
        paidFrom={expensePaymentSourceLabel(preview.paymentType ?? paymentType, locale)}
        usedBy={expenseUsedByLabel(preview.usedBy ?? usedBy, locale)}
        splitMethod={expenseSplitMethodLabel(preview.splitMethod ?? splitMethod, locale)}
        payerCredit={preview.payerCredit ?? 0}
        totalSharedCost={preview.totalSharedCost ?? 0}
        items={preview.items}
        shares={preview.shares ?? []}
        formatMoney={format.money}
        busy={disabled}
        onBack={onCancel}
        onSave={onConfirm}
        backLabel={common('cancel')}
        saveLabel={common('save')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <ExpenseEntryForm
        kind={isUtility ? 'utility' : 'expense'}
        paymentType={paymentType}
        onPaymentTypeChange={updatePaymentType}
        category={category}
        onCategoryChange={(value) => patchAll({
          category: value,
          ...(!advancedCustomized
            ? {
                usedBy: 'ALL_MEMBERS',
                splitMethod: value === 'FOOD' || value === 'GROCERY' ? 'MEAL_COUNT' : 'EQUAL',
              }
            : {}),
        })}
        paidBy={String(primary.purchasedBy ?? '')}
        onPaidByChange={(value) => patchAll({ purchasedBy: value || undefined })}
        showPaidBy={canManage}
        date={String(primary.expenseDate ?? '')}
        onDateChange={(value) => patchAll({ expenseDate: value, billingMonth: undefined })}
        items={editorItems}
        onItemsChange={replaceEditorItems}
        advancedOpen={advancedOpen}
        onAdvancedOpen={() => setAdvancedOpen(true)}
        onAdvancedClose={() => setAdvancedOpen(false)}
        usedBy={usedBy}
        onUsedByChange={(value) => {
          setAdvancedCustomized(true)
          updateUsedBy(value)
        }}
        splitMethod={splitMethod}
        onSplitMethodChange={(value) => {
          setAdvancedCustomized(true)
          patchAll({ splitMethod: value })
        }}
        members={members}
        selectedMemberIds={selectedMemberIds}
        onSelectedMemberIdsChange={(value) => patchAll({ selectedMemberIds: value })}
        customShares={customShares}
        customShareMemberIds={selectedMembers}
        onCustomSharesChange={(value) => patchAll({ customShares: value })}
        description={String(primary.description ?? '')}
        onDescriptionChange={(value) => patchAll({ description: value })}
        busy={disabled || previewBusy}
      />

      <FormStatusMessage message={previewNotice.notice?.message ?? ''} success={previewNotice.notice?.tone === 'success'} />
      <ExpenseActionBar>
        <ExpenseSecondaryAction onClick={onCancel} disabled={disabled || previewBusy}>{common('cancel')}</ExpenseSecondaryAction>
        <ExpensePrimaryAction onClick={() => void refreshPreview()} disabled={disabled || previewBusy}>
          <Eye size={17} /> {previewBusy ? t('calculating') : t('preview')}
        </ExpensePrimaryAction>
      </ExpenseActionBar>
    </div>
  )
}
