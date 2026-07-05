'use client'

import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SelectField, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_TYPES,
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
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
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

  async function handleSubmit() {
    setMessage('')
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
        await api.createExpense(data)
      } else {
        await api.createExpense(payload)
      }

      setForm(INITIAL_FORM)
      setReceiptFile(null)
      setMessage('Expense saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save expense.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Add Expense" subtitle="Exact backend fields" backHref="/" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <SelectField
            label="Category"
            value={form.category}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
            options={EXPENSE_CATEGORIES}
            getLabel={(value) => LABELS.EXPENSE_CATEGORIES[value]}
          />

          <TextField
            label="Item Name"
            value={form.itemName}
            onChange={(itemName) => setForm((prev) => ({ ...prev, itemName }))}
            placeholder="Rice"
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Quantity"
              value={form.quantity}
              onChange={(quantity) => setForm((prev) => ({ ...prev, quantity }))}
              placeholder="5"
              type="number"
            />
            <TextField
              label="Unit"
              value={form.unit}
              onChange={(unit) => setForm((prev) => ({ ...prev, unit }))}
              placeholder="kg"
            />
          </div>

          <TextField
            label="Amount"
            value={form.amount}
            onChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
            placeholder="1200"
            type="number"
          />

          <TextField
            label="Expense Date"
            value={form.expenseDate}
            onChange={(expenseDate) => setForm((prev) => ({ ...prev, expenseDate }))}
            type="date"
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Purchased By"
              value={form.purchasedBy}
              onChange={(purchasedBy) => setForm((prev) => ({ ...prev, purchasedBy }))}
              options={['', ...members.map((member) => member.id)] as string[]}
              getLabel={(value) => {
                if (!value) return 'Select member'
                const member = members.find((item) => item.id === value)
                return member ? member.name : value
              }}
            />
            <SelectField
              label="Buyer ID"
              value={form.buyerId}
              onChange={(buyerId) => setForm((prev) => ({ ...prev, buyerId }))}
              options={['', ...members.map((member) => member.id)] as string[]}
              getLabel={(value) => {
                if (!value) return 'Optional'
                const member = members.find((item) => item.id === value)
                return member ? member.name : value
              }}
            />
          </div>

          <SelectField
            label="Payment Type"
            value={form.paymentType}
            onChange={(paymentType) => setForm((prev) => ({ ...prev, paymentType }))}
            options={EXPENSE_PAYMENT_TYPES}
            getLabel={(value) => LABELS.EXPENSE_PAYMENT_TYPES[value]}
          />

          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(description) => setForm((prev) => ({ ...prev, description }))}
            placeholder="Monthly grocery run"
          />

          <TextField
            label="Receipt URL"
            hint="Optional if file is uploaded"
            value={form.receiptUrl}
            onChange={(receiptUrl) => setForm((prev) => ({ ...prev, receiptUrl }))}
            placeholder="https://..."
          />

          <FieldCard label="Receipt File" hint="Optional">
            <input
              className="field py-3"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
            />
          </FieldCard>

          {message ? <div className="rounded-2xl border border-[#cfe3ff] bg-[#e7f1ff] px-4 py-3 text-sm font-semibold text-[#0f7e86]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Expense
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
