'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
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
import { api } from '@/lib/api'
import { EXPENSE_CATEGORIES, LABELS, type ExpenseCategory, type ExpensePaymentType } from '@/lib/form-options'
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
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
      <form onSubmit={handleSubmit}>
        <FormPageShell title="Edit Expense" description={expense?.itemName ?? 'Update expense details'} icon={ReceiptText} backHref="/expenses">
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

            <div className="grid grid-cols-2 gap-4">
              <DesignedInput label="Quantity" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="5" type="number" />
              <DesignedInput label="Unit" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} placeholder="kg" />
            </div>

            <DesignedInput label="Amount (৳)" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Enter amount" type="number" />

            <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => setForm((prev) => ({ ...prev, expenseDate: event.target.value }))} type="date" />

            <div className="grid grid-cols-2 gap-4">
              <DesignedSelect label="Purchased By" icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => setForm((prev) => ({ ...prev, purchasedBy: event.target.value }))}>
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </DesignedSelect>

              <DesignedSelect label="Buyer ID" icon={expenseFormIcons.member} value={form.buyerId} onChange={(event) => setForm((prev) => ({ ...prev, buyerId: event.target.value }))}>
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
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 250) }))}
              placeholder="Monthly grocery run"
              count={`${form.description.length}/250`}
            />
          </FormSection>

          <FormSection>
            <DesignedInput label="Receipt URL" icon={expenseFormIcons.receipt} value={form.receiptUrl} onChange={(event) => setForm((prev) => ({ ...prev, receiptUrl: event.target.value }))} placeholder="https://..." />
            <UploadField label="Replace Receipt (Optional)" fileName={receiptFile?.name} onChange={setReceiptFile} />
          </FormSection>

          {message ? <div className="rounded-[18px] border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}

          <SubmitGradientButton busy={busy}>Save Changes</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
