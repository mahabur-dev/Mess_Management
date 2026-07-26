'use client'

import { type FormEvent, useEffect, useState } from 'react'
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
import { api } from '@/lib/api'
import { EXPENSE_CATEGORIES, LABELS, type ExpenseCategory, type ExpensePaymentType } from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type ExpenseRecord = {
  id: string
  category: ExpenseCategory
  purchasedBy?: string | null
  amount: string | number
  itemName?: string | null
  quantity?: string | number | null
  unit?: string | null
  expenseDate?: string | null
  description?: string | null
  receiptUrl?: string | null
  paymentType?: ExpensePaymentType | null
}

type FormState = {
  category: ExpenseCategory
  purchasedBy: string
  amount: string
  itemName: string
  quantity: string
  unit: string
  expenseDate: string
  description: string
  receiptUrl: string
  paymentType: ExpensePaymentType
}

const UTILITY_CATEGORY_SET = new Set<ExpenseCategory>(['UTILITY', 'ELECTRICITY', 'GAS', 'WIFI', 'WATER', 'CLEANER', 'MAINTENANCE', 'BUABILL'])

export default function EditExpensePage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''
  const [expense, setExpense] = useState<ExpenseRecord | null>(null)
  const members = useMessMemberOptions(messId, user)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState<FormState>({
    category: 'FOOD',
    purchasedBy: '',
    amount: '',
    itemName: '',
    quantity: '',
    unit: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    description: '',
    receiptUrl: '',
    paymentType: 'FROM_DEPOSIT',
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!expenseId || !messId) return
    let alive = true

    api
      .getExpensesByMess(messId, { limit: 500, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? (res.data as ExpenseRecord[]) : []
        const found = list.find((item) => item.id === expenseId) ?? null
        setExpense(found)

        if (!found) {
          setMessage('Expense not found.')
          return
        }

        setForm({
          category: found.category ?? 'FOOD',
          purchasedBy: found.purchasedBy ?? '',
          amount: found.amount ? String(found.amount) : '',
          itemName: found.itemName ?? '',
          quantity: found.quantity ? String(found.quantity) : '',
          unit: found.unit ?? '',
          expenseDate: found.expenseDate ?? new Date().toISOString().slice(0, 10),
          description: found.description ?? '',
          receiptUrl: found.receiptUrl ?? '',
          paymentType: found.paymentType ?? 'FROM_DEPOSIT',
        })
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load expense details.')
      })

    return () => {
      alive = false
    }
  }, [expenseId, messId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!expenseId) return setMessage('Expense id is missing.')

    setBusy(true)
    try {
      const payload = {
        purchasedBy: form.purchasedBy || undefined,
        category: form.category,
        amount: Number(form.amount),
        itemName: form.itemName.trim() || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        unit: form.unit.trim() || undefined,
        expenseDate: form.expenseDate,
        description: form.description.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
        paymentType: form.paymentType,
      }

      if (receiptFile) {
        const data = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') data.append(key, String(value))
        })
        data.append('receipt', receiptFile)
        await api.updateExpense(expenseId, data)
      } else {
        await api.updateExpense(expenseId, payload)
      }

      setMessage('Expense updated successfully.')
      router.push('/expenses')
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
        <FormPageShell
          title={isUtilityExpense ? 'Edit Utility' : 'Edit Expense'}
          description={expense?.itemName ?? (isUtilityExpense ? 'Update utility details' : 'Update expense details')}
          icon={ReceiptText}
          backHref="/expenses"
        >
          <FormSection>
            <PaymentTypeSelector value={form.paymentType} onChange={(paymentType) => setForm((prev) => ({ ...prev, paymentType }))} />
          </FormSection>

          <FormSection title="Expense Details">
            <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as ExpenseCategory }))}>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {LABELS.EXPENSE_CATEGORIES[category]}
                </option>
              ))}
            </DesignedSelect>

            <DesignedInput label="Item Name" icon={expenseFormIcons.item} value={form.itemName} onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))} placeholder="Rice" />

            <FormFieldGrid>
              <DesignedInput label="Quantity" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="5" type="number" />
              <DesignedInput label="Unit" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} placeholder="kg" />
            </FormFieldGrid>

            <DesignedInput label="Amount (৳)" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Enter amount" type="number" />

            <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => setForm((prev) => ({ ...prev, expenseDate: event.target.value }))} type="date" />

            <DesignedSelect
              label={isUtilityExpense ? 'Payment By' : 'Purchased By'}
              icon={expenseFormIcons.member}
              value={form.purchasedBy}
              onChange={(event) => setForm((prev) => ({ ...prev, purchasedBy: event.target.value }))}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </DesignedSelect>

            <DesignedTextarea
              label="Description"
              icon={expenseFormIcons.description}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 250) }))}
              placeholder="Monthly grocery run"
              count={`${form.description.length}/250`}
            />
          </FormSection>

          <FormSection>
            <DesignedInput label="Receipt URL" icon={expenseFormIcons.receipt} value={form.receiptUrl} onChange={(event) => setForm((prev) => ({ ...prev, receiptUrl: event.target.value }))} placeholder="https://..." />
            <UploadField label="Replace Receipt (Optional)" fileName={receiptFile?.name} onChange={setReceiptFile} />
          </FormSection>

          <FormStatusMessage message={message} />

          <SubmitGradientButton busy={busy}>Save Changes</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
