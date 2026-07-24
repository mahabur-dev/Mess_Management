'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { ReceiptText } from 'lucide-react'
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
import {
  EXPENSE_CATEGORIES,
  LABELS,
  type ExpenseCategory,
  type ExpensePaymentType,
} from '@/lib/form-options'
import { useAuth } from '../providers'

type MemberOption = {
  id: string
  name: string
  email: string
}

type FormState = {
  category: ExpenseCategory
  buyerId: string
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
  buyerId: '',
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
  const [members, setMembers] = useState<MemberOption[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!messId) return

    let alive = true
    const currentUser = user ? { id: user.id, name: user.name, email: user.email } : null
    api
      .getAllMembers({ limit: 200 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        const currentMessMembers = list
          .filter((item: any) => item.mess?.id === messId && item.user)
          .map((item: any) => ({ id: item.user.id, name: item.user.name, email: item.user.email }))
        setMembers(currentMessMembers.length ? currentMessMembers : currentUser ? [currentUser] : [])
      })
      .catch(() => {
        if (!alive) return
        setMembers(currentUser ? [currentUser] : [])
      })

    return () => {
      alive = false
    }
  }, [messId, user])

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
        buyerId: form.buyerId || undefined,
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

            <div className="grid grid-cols-2 gap-3">
              <DesignedInput label="Quantity" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="5" type="number" />
              <DesignedInput label="Unit" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => update('unit', event.target.value)} placeholder="kg" />
            </div>

            <DesignedInput label="Amount (৳)" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" />

            <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" />

            <div className="grid grid-cols-2 gap-3">
              <DesignedSelect label="Purchased By" icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)}>
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </DesignedSelect>
              <DesignedSelect label="Buyer ID" icon={expenseFormIcons.member} value={form.buyerId} onChange={(event) => update('buyerId', event.target.value)}>
                <option value="">Optional</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </DesignedSelect>
            </div>

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

          {message ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${success ? 'border-[#bfe7e6] bg-[#edfafa] text-[#008d8c]' : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'}`}>
              {message}
            </div>
          ) : null}

          <SubmitGradientButton busy={busy}>Save Expense</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
