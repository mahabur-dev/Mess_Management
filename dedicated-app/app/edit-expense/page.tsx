'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText, Save, Zap } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormFieldGrid,
  FormPageShell,
  FormSection,
  FormStatusMessage,
  PaymentTypeSelector,
  UploadField,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import { ExpensePrimaryAction, ExpenseSplitMethodSelector, ExpenseUsedBySelector } from '@/components/mobile/expense-ui'
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
  amount: string
  itemName: string
  quantity: string
  unit: string
  expenseDate: string
  billingMonth: string
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

function monthValue(value?: string | null) {
  return value?.slice(0, 7) || new Date().toISOString().slice(0, 7)
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
  utilityType: 'ELECTRICITY',
  purchasedBy: '',
  amount: '',
  itemName: '',
  quantity: '',
  unit: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  billingMonth: new Date().toISOString().slice(0, 7),
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
          amount: String(found.amount ?? ''),
          itemName: found.itemName ?? '',
          quantity: found.quantity == null ? '' : String(found.quantity),
          unit: found.unit ?? '',
          expenseDate: dateValue(found.expenseDate),
          billingMonth: monthValue(found.billingMonth ?? found.expenseDate),
          description: found.description ?? '',
          paymentType: found.paymentType ?? 'FROM_DEPOSIT',
          usedBy: found.usedBy ?? 'ALL_MEMBERS',
          splitMethod: found.splitMethod ?? 'EQUAL',
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
      amount: Number(form.amount),
      itemName: isUtilityExpense
        ? UTILITY_FORM_OPTIONS.find((option) => option.utilityType === form.utilityType)?.label ??
          LABELS.EXPENSE_CATEGORIES[form.category]
        : form.itemName.trim() || null,
      quantity: isUtilityExpense ? null : form.quantity ? Number(form.quantity) : null,
      unit: isUtilityExpense ? null : form.unit.trim() || null,
      expenseDate: form.expenseDate,
      billingMonth: `${form.billingMonth}-01`,
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

          <FormSection title="Paid From">
            <PaymentTypeSelector value={form.paymentType} onChange={(paymentType) => update('paymentType', paymentType)} showHeading={false} />
          </FormSection>

          <FormSection title="Used By">
            <ExpenseUsedBySelector
              value={form.usedBy}
              onChange={(usedBy) => {
                update('usedBy', usedBy)
                if (usedBy === 'SELF_ONLY') update('splitMethod', 'EQUAL')
                if (usedBy === 'MEAL_ON_MEMBERS' && form.splitMethod === 'CUSTOM') update('splitMethod', 'MEAL_COUNT')
              }}
            />

            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <MemberMultiSelect members={members} selected={form.selectedMemberIds} onChange={(ids) => update('selectedMemberIds', ids)} />
            ) : null}
          </FormSection>

          {form.usedBy !== 'SELF_ONLY' ? (
            <FormSection title="Split Method">
              <ExpenseSplitMethodSelector
                value={form.splitMethod}
                onChange={(splitMethod) => update('splitMethod', splitMethod)}
                allowCustom={form.usedBy !== 'MEAL_ON_MEMBERS'}
              />
              {form.splitMethod === 'CUSTOM' ? (
                <ExpenseCustomShareFields
                  members={members}
                  memberIds={affectedMemberIds}
                  shares={form.customShares}
                  onChange={(shares) => update('customShares', shares)}
                />
              ) : null}
            </FormSection>
          ) : null}

          {isUtilityExpense ? (
            <FormSection title="Utility Details">
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
              <FormFieldGrid>
                <DesignedInput label="Billing Month" icon={expenseFormIcons.date} value={form.billingMonth} onChange={(event) => update('billingMonth', event.target.value)} type="month" required />
                <DesignedInput label="Bill Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" required />
              </FormFieldGrid>
              <DesignedInput label="Amount" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" min="0.01" step="0.01" required />
              {isManager ? (
                <DesignedSelect label="Paid By" icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </DesignedSelect>
              ) : null}
              <DesignedTextarea label="Note (Optional)" icon={expenseFormIcons.description} value={form.description} onChange={(event) => update('description', event.target.value.slice(0, 250))} placeholder="Add a note" count={`${form.description.length}/250`} />
            </FormSection>
          ) : (
            <FormSection title="Expense Details">
              <FormFieldGrid>
                <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
                  {GENERAL_EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{LABELS.EXPENSE_CATEGORIES[category]}</option>
                  ))}
                </DesignedSelect>
                <DesignedInput label="Item" icon={expenseFormIcons.item} value={form.itemName} onChange={(event) => update('itemName', event.target.value)} placeholder="Expense item" />
              </FormFieldGrid>
              {form.category === 'FOOD' || form.category === 'GROCERY' ? (
                <FormFieldGrid>
                  <DesignedInput label="Quantity (Optional)" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="0" type="number" />
                  <DesignedInput label="Unit (Optional)" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => update('unit', event.target.value)} placeholder="kg" />
                </FormFieldGrid>
              ) : null}
              <DesignedInput label="Amount" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" min="0.01" step="0.01" required />
              <FormFieldGrid>
                <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" required />
                <DesignedInput label="Billing Month" icon={expenseFormIcons.date} value={form.billingMonth} onChange={(event) => update('billingMonth', event.target.value)} type="month" required />
              </FormFieldGrid>
              {isManager ? (
                <DesignedSelect label={form.paymentType === 'PERSONAL' ? 'Paid By' : 'Purchased By'} icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </DesignedSelect>
              ) : null}
              <DesignedTextarea label="Note (Optional)" icon={expenseFormIcons.description} value={form.description} onChange={(event) => update('description', event.target.value.slice(0, 250))} placeholder="Add a note" count={`${form.description.length}/250`} />
            </FormSection>
          )}

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
