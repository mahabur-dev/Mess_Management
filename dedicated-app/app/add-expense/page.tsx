'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { ReceiptText } from 'lucide-react'
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
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import {
  EXPENSE_CATEGORIES,
  LABELS,
  type ExpenseCategory,
  type ExpensePaymentType,
} from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'

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

const INITIAL_FORM: FormState = {
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
}

export default function AddExpensePage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSuccess(false)

    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')
    if (!form.expenseDate) return setMessage('Expense date is required.')

    setBusy(true)
    try {
      const payload = {
        messId,
        purchasedBy: form.purchasedBy || undefined,
        category: form.category,
        amount: Number(form.amount),
        itemName: form.itemName.trim() || LABELS.EXPENSE_CATEGORIES[form.category],
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
        await api.createExpense(data)
      } else {
        await api.createExpense(payload)
      }

      setForm(INITIAL_FORM)
      setReceiptFile(null)
      setSuccess(true)
      setMessage('Expense saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save expense.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <form onSubmit={handleSubmit}>
        <FormPageShell title="Add Expense" description="Add a new expense for your mess" icon={ReceiptText} backHref="/expenses">
          <FormSection>
            <PaymentTypeSelector value={form.paymentType} onChange={(value) => update('paymentType', value)} />
          </FormSection>

          <FormSection title="Expense Details">
            <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {LABELS.EXPENSE_CATEGORIES[category]}
                </option>
              ))}
            </DesignedSelect>

            <DesignedInput label="Item Name" icon={expenseFormIcons.item} value={form.itemName} onChange={(event) => update('itemName', event.target.value)} placeholder="Rice, cleaner, lunch..." />

            <FormFieldGrid>
              <DesignedInput label="Quantity" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="5" type="number" />
              <DesignedInput label="Unit" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => update('unit', event.target.value)} placeholder="kg" />
            </FormFieldGrid>

            <DesignedInput label="Amount (৳)" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" />

            <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" />

            <DesignedSelect label="Purchased By" icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)}>
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
              onChange={(event) => update('description', event.target.value.slice(0, 250))}
              placeholder="Add expense note..."
              count={`${form.description.length}/250`}
            />
          </FormSection>

          <FormSection>
            <DesignedInput label="Receipt URL" icon={expenseFormIcons.receipt} value={form.receiptUrl} onChange={(event) => update('receiptUrl', event.target.value)} placeholder="https://..." />
            <UploadField fileName={receiptFile?.name} onChange={setReceiptFile} />
          </FormSection>

          <FormStatusMessage message={message} success={success} />

          <SubmitGradientButton busy={busy}>Save Expense</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
