'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText } from 'lucide-react'
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
  SubmitGradientButton,
  UploadField,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { LoadingIndicator } from '@/components/loading-indicator'
import { api } from '@/lib/api'
import {
  EXPENSE_CATEGORIES,
  LABELS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type CustomShare = {
  memberId: string
  amount: string
}

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
  shares?: Array<{ memberId: string; shareAmount: number }>
}

type FormState = {
  category: ExpenseCategory
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
  customShares: CustomShare[]
}

const UTILITY_CATEGORY_SET = new Set<ExpenseCategory>([
  'UTILITY',
  'ELECTRICITY',
  'GAS',
  'WIFI',
  'WATER',
  'CLEANER',
  'MAINTENANCE',
  'BUABILL',
])

const UTILITY_TYPE_BY_CATEGORY: Partial<Record<ExpenseCategory, string>> = {
  ELECTRICITY: 'ELECTRICITY',
  GAS: 'GAS',
  WATER: 'WATER',
  WIFI: 'WIFI',
  CLEANER: 'CLEANING',
  UTILITY: 'OTHER',
}

function dateValue(value?: string | null) {
  return value?.slice(0, 10) || new Date().toISOString().slice(0, 10)
}

function monthValue(value?: string | null) {
  return value?.slice(0, 7) || new Date().toISOString().slice(0, 7)
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
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
  const members = useMessMemberOptions(messId, user)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null)
  const [removeReceipt, setRemoveReceipt] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
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

        const shares = found.shares ?? []
        setExistingReceiptUrl(found.receiptUrl ?? null)
        setForm({
          category: found.category ?? 'FOOD',
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
  }, [expenseId, messId])

  const affectedMemberIds = useMemo(() => {
    if (form.usedBy === 'SELF_ONLY') return form.purchasedBy ? [form.purchasedBy] : []
    if (form.usedBy === 'SELECTED_MEMBERS') return form.selectedMemberIds
    if (form.usedBy === 'ALL_MEMBERS') return members.map((member) => member.id)
    return form.selectedMemberIds
  }, [form.purchasedBy, form.selectedMemberIds, form.usedBy, members])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleMember(memberId: string) {
    update(
      'selectedMemberIds',
      form.selectedMemberIds.includes(memberId)
        ? form.selectedMemberIds.filter((id) => id !== memberId)
        : [...form.selectedMemberIds, memberId]
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!expenseId) return setMessage('Expense id is missing.')
    if (form.usedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) {
      return setMessage('Select at least one affected member.')
    }

    const customShares =
      form.splitMethod === 'CUSTOM'
        ? affectedMemberIds.map((memberId) => ({
            memberId,
            amount: Number(form.customShares.find((share) => share.memberId === memberId)?.amount ?? 0),
          }))
        : undefined

    const isUtilityExpense = UTILITY_CATEGORY_SET.has(form.category)
    const payload = {
      type: isUtilityExpense ? 'UTILITY' : 'EXPENSE',
      utilityType: isUtilityExpense ? UTILITY_TYPE_BY_CATEGORY[form.category] ?? 'OTHER' : null,
      purchasedBy: form.purchasedBy || undefined,
      category: form.category,
      amount: Number(form.amount),
      itemName: form.itemName.trim() || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit: form.unit.trim() || null,
      expenseDate: form.expenseDate,
      billingMonth: `${form.billingMonth}-01`,
      description: form.description.trim() || null,
      paymentType: form.paymentType,
      usedBy: form.usedBy,
      splitMethod: form.usedBy === 'SELF_ONLY' ? 'EQUAL' : form.splitMethod,
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

  const isUtilityExpense = UTILITY_CATEGORY_SET.has(form.category)

  return (
    <MobileShell>
      <form onSubmit={handleSubmit}>
        <FormPageShell title={isUtilityExpense ? 'Edit Utility' : 'Edit Expense'} icon={ReceiptText} backHref="/expenses">
          {loading ? <LoadingIndicator variant="card" label="Loading expense" /> : null}

          <FormSection title="Paid From">
            <PaymentTypeSelector value={form.paymentType} onChange={(paymentType) => update('paymentType', paymentType)} showHeading={false} />
          </FormSection>

          <FormSection title="Allocation">
            <DesignedSelect
              label="Used By"
              icon={expenseFormIcons.member}
              value={form.usedBy}
              onChange={(event) => {
                const usedBy = event.target.value as ExpenseUsedBy
                update('usedBy', usedBy)
                if (usedBy === 'SELF_ONLY') update('splitMethod', 'EQUAL')
                if (usedBy === 'MEAL_ON_MEMBERS' && form.splitMethod === 'CUSTOM') update('splitMethod', 'MEAL_COUNT')
              }}
            >
              <option value="SELF_ONLY">Self Only</option>
              <option value="SELECTED_MEMBERS">Selected Members</option>
              <option value="ALL_MEMBERS">All Members</option>
              <option value="MEAL_ON_MEMBERS">Meal-On Members</option>
            </DesignedSelect>

            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => {
                  const selected = form.selectedMemberIds.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`rounded-[13px] border px-3 py-2.5 text-left text-label font-bold ${
                        selected ? 'border-[#008d8c] bg-[#edfafa] text-[#008d8c]' : 'border-[#dce5ec] bg-white text-[#123748]'
                      }`}
                    >
                      {member.name}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {form.usedBy !== 'SELF_ONLY' ? (
              <DesignedSelect
                label="Split Method"
                icon={expenseFormIcons.amount}
                value={form.splitMethod}
                onChange={(event) => update('splitMethod', event.target.value as ExpenseSplitMethod)}
              >
                <option value="EQUAL">Equal</option>
                <option value="MEAL_COUNT">Meal Count</option>
                {form.usedBy !== 'MEAL_ON_MEMBERS' ? <option value="CUSTOM">Custom Split</option> : null}
              </DesignedSelect>
            ) : null}

            {form.splitMethod === 'CUSTOM' && form.usedBy !== 'SELF_ONLY' ? (
              <div className="space-y-2">
                {affectedMemberIds.map((memberId) => (
                  <DesignedInput
                    key={memberId}
                    label={members.find((member) => member.id === memberId)?.name ?? memberId}
                    icon={expenseFormIcons.amount}
                    value={form.customShares.find((share) => share.memberId === memberId)?.amount ?? ''}
                    onChange={(event) => {
                      const amount = event.target.value
                      update('customShares', [
                        ...form.customShares.filter((share) => share.memberId !== memberId),
                        { memberId, amount },
                      ])
                    }}
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                ))}
              </div>
            ) : null}
          </FormSection>

          <FormSection title="Expense Details">
            <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {LABELS.EXPENSE_CATEGORIES[category]}
                </option>
              ))}
            </DesignedSelect>

            <DesignedInput label="Item Name" icon={expenseFormIcons.item} value={form.itemName} onChange={(event) => update('itemName', event.target.value)} placeholder="Rice" />

            {form.category === 'FOOD' || form.category === 'GROCERY' ? (
              <FormFieldGrid>
                <DesignedInput label="Quantity (Optional)" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="0" type="number" min="0" />
                <DesignedInput label="Unit (Optional)" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => update('unit', event.target.value)} placeholder="kg" />
              </FormFieldGrid>
            ) : null}

            <DesignedInput label="Amount" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" min="0.01" step="0.01" required />

            <FormFieldGrid>
              <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" required />
              <DesignedInput label="Billing Month" icon={expenseFormIcons.date} value={form.billingMonth} onChange={(event) => update('billingMonth', event.target.value)} type="month" required />
            </FormFieldGrid>

            <DesignedSelect label={form.paymentType === 'PERSONAL' ? 'Paid By' : 'Purchased By'} icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </DesignedSelect>

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
          <SubmitGradientButton busy={busy}>Save Changes</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
