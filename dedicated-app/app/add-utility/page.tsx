'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Zap } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormPageShell,
  FormSection,
  PaymentTypeSelector,
  SubmitGradientButton,
  UploadField,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { LABELS, type ExpenseCategory, type ExpensePaymentType } from '@/lib/form-options'
import { useAuth } from '../providers'

const UTILITY_CATEGORIES: ExpenseCategory[] = ['UTILITY', 'ELECTRICITY', 'GAS', 'WIFI', 'WATER', 'CLEANER', 'MAINTENANCE', 'BUABILL', 'OTHER']

type FormState = {
  category: ExpenseCategory
  amount: string
  description: string
  receiptUrl: string
  paymentType: ExpensePaymentType
}

const INITIAL_FORM: FormState = {
  category: 'UTILITY',
  amount: '',
  description: '',
  receiptUrl: '',
  paymentType: 'FROM_DEPOSIT',
}

export default function AddUtilityPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
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
    if (!form.amount) return setMessage('Price is required.')

    setBusy(true)
    try {
      const payload = {
        messId,
        category: form.category,
        amount: Number(form.amount),
        itemName: LABELS.EXPENSE_CATEGORIES[form.category],
        expenseDate: new Date().toISOString().slice(0, 10),
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
      setMessage('Utility saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save utility.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <form onSubmit={handleSubmit}>
        <FormPageShell title="Add Utility" description="Add a new utility cost for your mess" icon={Zap} backHref="/expenses">
          <FormSection>
            <PaymentTypeSelector value={form.paymentType} onChange={(value) => update('paymentType', value)} />
          </FormSection>

          <FormSection title="Utility Details">
            <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
              {UTILITY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {LABELS.EXPENSE_CATEGORIES[category]}
                </option>
              ))}
            </DesignedSelect>

            <DesignedInput label="Price (৳)" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" />

            <DesignedTextarea
              label="Description"
              icon={expenseFormIcons.description}
              value={form.description}
              onChange={(event) => update('description', event.target.value.slice(0, 250))}
              placeholder="Add utility note..."
              count={`${form.description.length}/250`}
            />

          </FormSection>

          <FormSection>
            <DesignedInput label="Receipt URL" icon={expenseFormIcons.receipt} value={form.receiptUrl} onChange={(event) => update('receiptUrl', event.target.value)} placeholder="https://..." />
            <UploadField fileName={receiptFile?.name} onChange={setReceiptFile} />
          </FormSection>

          {message ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${success ? 'border-[#bfe7e6] bg-[#edfafa] text-[#008d8c]' : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'}`}>
              {message}
            </div>
          ) : null}

          <SubmitGradientButton busy={busy}>Save Utility</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
