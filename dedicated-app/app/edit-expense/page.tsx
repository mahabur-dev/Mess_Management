'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText, Save, Zap } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormPageShell,
  FormSection,
  FormStatusMessage,
  PaymentTypeSelector,
  UploadField,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import {
  ExpenseLineItemsEditor,
  expenseLineItemsPayload,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import { ExpenseAdvancedOptions, ExpensePrimaryAction } from '@/components/mobile/expense-ui'
import {
  ExpenseCustomShareFields,
  buildCustomShares,
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import {
  GENERAL_EXPENSE_CATEGORIES,
  LABELS,
  UTILITY_FORM_OPTIONS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type ExpenseRecord = {
  id: string
  type?: 'EXPENSE' | 'UTILITY'
  category: ExpenseCategory
  utilityType?: string | null
  purchasedBy?: string | null
  amount: string | number
  itemName?: string | null
  quantity?: string | number | null
  unit?: string | null
  items?: Array<{
    id?: string
    itemName: string
    quantity?: string | number | null
    unit?: string | null
    amount: string | number
  }>
  expenseDate?: string | null
  billingMonth?: string | null
  description?: string | null
  receiptUrl?: string | null
  paymentType?: ExpensePaymentType | null
  usedBy?: ExpenseUsedBy | null
  splitMethod?: ExpenseSplitMethod | null
  createdById?: string | null
  creator?: { id?: string | null } | null
  shares?: Array<{ memberId: string; shareAmount: number }>
}

type FormState = {
  category: ExpenseCategory
  utilityType: string
  purchasedBy: string
  items: ExpenseLineItem[]
  expenseDate: string
  description: string
  paymentType: ExpensePaymentType
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  selectedMemberIds: string[]
  customShares: ExpenseCustomShare[]
}

const UTILITY_CATEGORY_SET = new Set<ExpenseCategory>(UTILITY_FORM_OPTIONS.map((option) => option.category))
const LEGACY_UTILITY_CATEGORY_SET = new Set<ExpenseCategory>([
  ...UTILITY_CATEGORY_SET,
  'MAINTENANCE',
  'BUABILL',
])

function dateValue(value?: string | null) {
  return value?.slice(0, 10) || new Date().toISOString().slice(0, 10)
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
  utilityType: 'ELECTRICITY',
  purchasedBy: '',
  items: [{ id: 'initial-item', itemName: '', quantity: '', unit: '', amount: '' }],
  expenseDate: new Date().toISOString().slice(0, 10),
  description: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'MEAL_COUNT',
  selectedMemberIds: [],
  customShares: [],
}

export default function EditExpensePage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''
  const isManager = canManageMess(user)
  const members = useMessMemberOptions(messId, user)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null)
  const [removeReceipt, setRemoveReceipt] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [recordType, setRecordType] = useState<'EXPENSE' | 'UTILITY'>('EXPENSE')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (!expenseId || !messId) return
    let alive = true
    setLoading(true)
    setMessage('')

    api
      .getExpenseById(expenseId)
      .then((res) => {
        if (!alive) return
        const found = (res.data as ExpenseRecord | null) ?? null
        if (!found) {
          setMessage('Expense not found.')
          return
        }
        const createdById = found.createdById ?? found.creator?.id
        if (!isManager && createdById !== user?.id) {
          router.replace(`/expense-details?expenseId=${encodeURIComponent(expenseId)}&messId=${encodeURIComponent(messId)}`)
          return
        }

        const shares = found.shares ?? []
        const foundType = found.type ?? (LEGACY_UTILITY_CATEGORY_SET.has(found.category) ? 'UTILITY' : 'EXPENSE')
        setRecordType(foundType)
        setExistingReceiptUrl(found.receiptUrl ?? null)
        setForm({
          category: found.category ?? 'FOOD',
          utilityType:
            found.utilityType ??
            UTILITY_FORM_OPTIONS.find((option) => option.category === found.category)?.utilityType ??
            'OTHER',
          purchasedBy: found.purchasedBy ?? '',
          items: found.items?.length
            ? found.items.map((item, index) => ({
                id: item.id ?? `expense-item-${index}`,
                itemName: item.itemName,
                quantity: item.quantity == null ? '' : String(item.quantity),
                unit: item.unit ?? '',
                amount: String(item.amount),
              }))
            : [{
                id: 'legacy-item',
                itemName: found.itemName ?? LABELS.EXPENSE_CATEGORIES[found.category],
                quantity: found.quantity == null ? '' : String(found.quantity),
                unit: found.unit ?? '',
                amount: String(found.amount ?? ''),
              }],
          expenseDate: dateValue(found.expenseDate),
          description: found.description ?? '',
          paymentType: found.paymentType ?? 'FROM_DEPOSIT',
          usedBy: foundType === 'UTILITY' && found.usedBy === 'MEAL_ON_MEMBERS' ? 'ALL_MEMBERS' : found.usedBy ?? 'ALL_MEMBERS',
          splitMethod: foundType === 'UTILITY' && found.splitMethod === 'MEAL_COUNT' ? 'EQUAL' : found.splitMethod ?? 'EQUAL',
          selectedMemberIds: shares.map((share) => share.memberId),
          customShares: shares.map((share) => ({
            memberId: share.memberId,
            amount: String(share.shareAmount),
          })),
        })
      })
      .catch((error) => {
        if (alive) setMessage(error instanceof Error ? error.message : 'Failed to load expense details.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [expenseId, isManager, messId, router, user?.id])

  const affectedMemberIds = useMemo(() => {
    if (form.usedBy === 'SELF_ONLY') return form.purchasedBy ? [form.purchasedBy] : []
    if (form.usedBy === 'SELECTED_MEMBERS') return form.selectedMemberIds
    if (form.usedBy === 'ALL_MEMBERS') return members.map((member) => member.id)
    return form.selectedMemberIds
  }, [form.purchasedBy, form.selectedMemberIds, form.usedBy, members])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!expenseId) return setMessage('Expense id is missing.')
    if (form.usedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) {
      return setMessage('Select at least one affected member.')
    }
    if (form.splitMethod === 'CUSTOM' && !affectedMemberIds.length) {
      return setMessage('Select members before custom split.')
    }
    if (form.items.some((item) => !item.itemName.trim() || !item.amount || Number(item.amount) <= 0)) {
      return setMessage('Every item requires a name and a valid line amount.')
    }

    const customShares =
      form.splitMethod === 'CUSTOM'
        ? buildCustomShares(affectedMemberIds, form.customShares)
        : undefined

    const isUtilityExpense = recordType === 'UTILITY'
    const payload = {
      type: isUtilityExpense ? 'UTILITY' : 'EXPENSE',
      utilityType: isUtilityExpense ? form.utilityType : null,
      purchasedBy: isManager ? form.purchasedBy || undefined : undefined,
      category: form.category,
      items: expenseLineItemsPayload(form.items),
      expenseDate: form.expenseDate,
      description: form.description.trim() || null,
      paymentType: form.paymentType,
      usedBy: form.usedBy,
      splitMethod: form.usedBy !== 'SELF_ONLY' ? form.splitMethod : 'EQUAL',
      selectedMemberIds: form.usedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : undefined,
      customShares,
      receiptUrl: removeReceipt && !receiptFile ? null : undefined,
    }

    setBusy(true)
    try {
      if (receiptFile) {
        const data = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return
          if (key === 'utilityType' && value === null) return
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            data.append(key, JSON.stringify(value))
          } else if (value === null) {
            data.append(key, '')
          } else {
            data.append(key, String(value))
          }
        })
        data.append('receipt', receiptFile)
        await api.updateExpense(expenseId, data)
      } else {
        await api.updateExpense(expenseId, payload)
      }

      router.replace(`/expense-details?expenseId=${encodeURIComponent(expenseId)}&messId=${encodeURIComponent(messId)}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update expense.')
    } finally {
      setBusy(false)
    }
  }

  const isUtilityExpense = recordType === 'UTILITY'

  return (
    <MobileShell>
      <form onSubmit={handleSubmit}>
        <FormPageShell title={isUtilityExpense ? 'Edit Utility' : 'Edit Expense'} icon={isUtilityExpense ? Zap : ReceiptText} backHref="/expenses">
          {loading ? <LoadingIndicator variant="card" label="Loading expense" /> : null}

          <FormSection title="Payment Source">
            <PaymentTypeSelector value={form.paymentType} onChange={(paymentType) => update('paymentType', paymentType)} showHeading={false} />
          </FormSection>

          <FormSection title={isUtilityExpense ? 'Utility Details' : 'Expense Details'}>
            {isUtilityExpense ? (
              <DesignedSelect
                label="Utility Type"
                icon={expenseFormIcons.category}
                value={form.utilityType}
                onChange={(event) => {
                  const option =
                    UTILITY_FORM_OPTIONS.find((item) => item.utilityType === event.target.value) ??
                    UTILITY_FORM_OPTIONS[0]
                  update('utilityType', option.utilityType)
                  update('category', option.category)
                }}
              >
                {UTILITY_FORM_OPTIONS.map((option) => (
                  <option key={option.utilityType} value={option.utilityType}>
                    {option.label}
                  </option>
                ))}
              </DesignedSelect>
            ) : (
              <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
                {GENERAL_EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{LABELS.EXPENSE_CATEGORIES[category]}</option>
                ))}
              </DesignedSelect>
            )}
            {isManager ? (
              <DesignedSelect label="Paid By" icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </DesignedSelect>
            ) : null}
            <DesignedInput label={isUtilityExpense ? 'Bill Date' : 'Expense Date'} icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" required />
          </FormSection>

          <FormSection title="Items">
            <ExpenseLineItemsEditor items={form.items} onChange={(items) => update('items', items)} disabled={busy} />
          </FormSection>

          <ExpenseAdvancedOptions
            open={advancedOpen}
            usedBy={form.usedBy}
            splitMethod={form.splitMethod}
            allowMealMembers={!isUtilityExpense}
            allowMealCount={!isUtilityExpense}
            allowCustom={isUtilityExpense || form.usedBy !== 'MEAL_ON_MEMBERS'}
            onOpen={() => setAdvancedOpen(true)}
            onClose={() => setAdvancedOpen(false)}
            onUsedByChange={(usedBy) => {
              update('usedBy', usedBy)
              if (usedBy === 'SELF_ONLY') update('splitMethod', 'EQUAL')
              if (usedBy === 'MEAL_ON_MEMBERS' && form.splitMethod === 'CUSTOM') update('splitMethod', 'MEAL_COUNT')
            }}
            onSplitMethodChange={(splitMethod) => update('splitMethod', splitMethod)}
          >
            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <MemberMultiSelect members={members} selected={form.selectedMemberIds} onChange={(ids) => update('selectedMemberIds', ids)} />
            ) : null}
            {form.usedBy !== 'SELF_ONLY' && form.splitMethod === 'CUSTOM' ? (
              <ExpenseCustomShareFields
                members={members}
                memberIds={affectedMemberIds}
                shares={form.customShares}
                onChange={(shares) => update('customShares', shares)}
              />
            ) : null}
          </ExpenseAdvancedOptions>

          <FormSection title="Note">
            <DesignedTextarea label="Note (Optional)" icon={expenseFormIcons.description} value={form.description} onChange={(event) => update('description', event.target.value.slice(0, 250))} placeholder="Add a note" count={`${form.description.length}/250`} />
          </FormSection>

          <FormSection title="Attachment">
            {existingReceiptUrl && !removeReceipt ? (
              <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#cfeeed] bg-[#edfafa] px-3.5 py-3">
                <a href={existingReceiptUrl} target="_blank" rel="noreferrer" className="truncate text-label font-bold text-[#008d8c]">
                  View current receipt
                </a>
                <button type="button" onClick={() => setRemoveReceipt(true)} className="text-caption font-bold text-[#e02d37]">
                  Remove
                </button>
              </div>
            ) : null}
            <UploadField label="Replace Receipt (Optional)" fileName={receiptFile?.name} onChange={(file) => { setReceiptFile(file); if (file) setRemoveReceipt(false) }} />
          </FormSection>

          <FormStatusMessage message={message} />
          <ExpensePrimaryAction type="submit" disabled={busy}>
            <Save size={17} />
            {busy ? 'Saving...' : 'Save Changes'}
          </ExpensePrimaryAction>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
