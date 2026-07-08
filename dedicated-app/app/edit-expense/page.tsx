'use client'

//hello
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_TYPES, LABELS, type ExpenseCategory, type ExpensePaymentType } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type MemberOption = {
  id: string
  name: string
  email: string
}

type ExpenseRecord = {
  id: string
  category: ExpenseCategory
  buyerId?: string | null
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

export default function EditExpensePage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''
  const [expense, setExpense] = useState<ExpenseRecord | null>(null)
  const [members, setMembers] = useState<MemberOption[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState<FormState>({
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
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!messId) return
    let alive = true

    api
      .getAllMembers({ limit: 200 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        const currentMessMembers = list
          .filter((item: any) => item.mess?.id === messId && item.user)
          .map((item: any) => ({ id: item.user.id, name: item.user.name, email: item.user.email }))
        setMembers(currentMessMembers.length ? currentMessMembers : user ? [{ id: user.id, name: user.name, email: user.email }] : [])
      })
      .catch(() => {
        if (!alive) return
        setMembers(user ? [{ id: user.id, name: user.name, email: user.email }] : [])
      })

    return () => {
      alive = false
    }
  }, [messId, user])

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
          buyerId: found.buyerId ?? '',
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

  async function handleSubmit() {
    setMessage('')
    if (!expenseId) return setMessage('Expense id is missing.')

    setBusy(true)
    try {
      const payload = {
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

  return (
    <MobileShell>
      <TopScreen title="Edit Expense" subtitle={expense?.itemName ?? 'Update expense details'} backHref="/expenses" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <SelectField
            label="Category"
            value={form.category}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
            options={EXPENSE_CATEGORIES}
            getLabel={(value) => LABELS.EXPENSE_CATEGORIES[value]}
          />
          <TextField label="Item Name" value={form.itemName} onChange={(itemName) => setForm((prev) => ({ ...prev, itemName }))} placeholder="Rice" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Quantity" value={form.quantity} onChange={(quantity) => setForm((prev) => ({ ...prev, quantity }))} placeholder="5" type="number" />
            <TextField label="Unit" value={form.unit} onChange={(unit) => setForm((prev) => ({ ...prev, unit }))} placeholder="kg" />
          </div>
          <TextField label="Amount" value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="1200" type="number" />
          <TextField label="Expense Date" value={form.expenseDate} onChange={(expenseDate) => setForm((prev) => ({ ...prev, expenseDate }))} type="date" />
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
          <div className="rounded-2xl bg-[#f7fbfd] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667b8a]">Replace Receipt File</div>
            <div className="mt-2">
              <input className="field py-3" type="file" accept="image/*,application/pdf" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
            </div>
          </div>
          {message ? <div className="rounded-2xl border border-[#ffd8c0] bg-[#fff4ea] px-4 py-3 text-sm font-semibold text-[#fc782d]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Changes
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
