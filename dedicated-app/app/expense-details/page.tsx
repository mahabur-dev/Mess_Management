'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  CircleIcon,
  HeaderIconButton,
  ScreenHeader,
  categoryIcon,
  categoryLabel,
  categoryTone,
  detailIcons,
  formatBDT,
  formatDate,
  formatDateTime,
  paymentLabel,
} from '@/components/mobile/expense-design'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type ExpenseRecord = {
  id: string
  category?: string | null
  amount?: string | number | null
  itemName?: string | null
  expenseDate?: string | null
  expense_date?: string | null
  createdAt?: string | null
  created_at?: string | null
  description?: string | null
  receiptUrl?: string | null
  paymentType?: string | null
  payment_method?: string | null
  purchasedBy?: string | null
  buyerId?: string | null
  purchased_by?: { name?: string | null } | null
  buyer?: { name?: string | null } | null
  created_by?: { name?: string | null } | null
  addedBy?: { name?: string | null } | null
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof detailIcons.amount; label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="grid h-7 w-7 place-items-center rounded-full text-[#008d8c]">
        <Icon size={17} />
      </span>
      <span className="min-w-0 text-[12px] font-medium text-[#123748]">{label}</span>
      <span className="max-w-[150px] truncate text-right text-[12px] font-bold text-[#123748]">{value}</span>
    </div>
  )
}

export default function ExpenseDetailsPage() {
  const router = useRouter()
  const searchParams = useQueryParams()
  const { user } = useAuth()
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? ''
  const [expense, setExpense] = useState<ExpenseRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!expenseId || !messId) return

    let alive = true
    setLoading(true)
    setMessage('')
    api
      .getExpensesByMess(messId, { limit: 500, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? (res.data as ExpenseRecord[]) : []
        const found = list.find((item) => item.id === expenseId) ?? null
        setExpense(found)
        if (!found) setMessage('Expense not found.')
      })
      .catch((error) => {
        if (!alive) return
        setMessage(error instanceof Error ? error.message : 'Failed to load expense details.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [expenseId, messId])

  const details = useMemo(() => {
    if (!expense) return null
    const addedOn = expense.createdAt ?? expense.created_at ?? expense.expenseDate ?? expense.expense_date
    return {
      category: categoryLabel(expense.category),
      amount: formatBDT(expense.amount),
      date: formatDate(expense.expenseDate ?? expense.expense_date),
      payment: expense.payment_method || paymentLabel(expense.paymentType),
      addedOn: formatDateTime(addedOn),
      purchasedBy: expense.purchased_by?.name || expense.buyer?.name || expense.purchasedBy || 'Mahabur Rahman',
      addedBy: expense.created_by?.name || expense.addedBy?.name || 'Mahabur Rahman',
      description: expense.description || 'No description added.',
      receipt: expense.receiptUrl ? 'Receipt uploaded.' : 'No receipt uploaded.',
    }
  }, [expense])

  async function deleteExpense() {
    if (!expenseId || deleting) return
    if (!window.confirm('Delete this expense permanently?')) return

    setDeleting(true)
    setMessage('')
    try {
      await api.deleteExpense(expenseId)
      router.replace('/expenses')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete expense.')
      setDeleting(false)
    }
  }

  const Icon = categoryIcon(expense?.category)
  const tone = categoryTone(expense?.category)

  return (
    <MobileShell>
      <ScreenHeader
        title="Expense Details"
        left={<HeaderIconButton href="/expenses" label="Back to expenses" icon={<ChevronLeft size={19} />} />}
        right={<HeaderIconButton label="More actions" icon={<MoreHorizontal size={19} />} />}
      />

      <div className="screen -mt-2 space-y-4">
        {loading ? <div className="rounded-[24px] bg-white/90 p-6 text-center text-sm font-bold text-[#65838b]">Loading expense details...</div> : null}
        {message ? <div className="rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">{message}</div> : null}

        {expense && details ? (
          <>
            <section className="detail-hero p-5">
              <div className="relative z-10 flex items-center gap-4">
                <CircleIcon icon={Icon} size="lg" tone={{ bg: '#ffffff', fg: tone.fg }} />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold uppercase text-white/92">{details.category}</div>
                  <div className="mt-2 truncate text-[24px] font-black leading-none">{formatBDT(expense.amount)}</div>
                  <div className="mt-3 inline-flex rounded-[10px] bg-white/16 px-3 py-1.5 text-[11px] font-black">{details.payment}</div>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-white/92">
                    <detailIcons.date size={15} />
                    <span>{details.addedOn}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-0 overflow-hidden rounded-[14px] bg-white shadow-[0_12px_28px_rgba(18,55,72,0.08)]">
              <div className="border-r border-[#edf1f4] p-4">
                <CircleIcon icon={detailIcons.purchased} tone={{ bg: '#e8f8f1', fg: '#008d8c' }} />
                <div className="mt-3 text-[10px] font-bold uppercase text-[#4f6375]">Purchased By</div>
                <div className="mt-1.5 truncate text-[13px] font-black text-[#123748]">{details.purchasedBy}</div>
              </div>
              <div className="p-4">
                <CircleIcon icon={detailIcons.user} tone={{ bg: '#edf7ff', fg: '#1283c9' }} />
                <div className="mt-3 text-[10px] font-bold uppercase text-[#4f6375]">Added By</div>
                <div className="mt-1.5 truncate text-[13px] font-black text-[#123748]">{details.addedBy}</div>
              </div>
            </section>

            <section className="detail-card">
              <DetailRow icon={detailIcons.category} label="Category" value={details.category.toUpperCase()} />
              <DetailRow icon={detailIcons.amount} label="Amount" value={details.amount} />
              <DetailRow icon={detailIcons.date} label="Expense Date" value={details.date} />
              <DetailRow icon={detailIcons.payment} label="Payment Method" value={details.payment} />
              <DetailRow icon={detailIcons.added} label="Added On" value={details.addedOn} />
            </section>

            <section className="detail-card flex gap-3">
              <CircleIcon icon={detailIcons.description} size="sm" />
              <div>
                <h2 className="text-[13px] font-black text-[#123748]">Description</h2>
                <p className="mt-2 text-[12px] leading-5 text-[#123748]">{details.description}</p>
              </div>
            </section>

            <section className="detail-card flex gap-3">
              <CircleIcon icon={detailIcons.receipt} size="sm" />
              <div>
                <h2 className="text-[13px] font-black text-[#123748]">Receipt</h2>
                <p className="mt-2 text-[12px] leading-5 text-[#123748]">{details.receipt}</p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 pb-3">
              <Link
                href={`/edit-expense?expenseId=${encodeURIComponent(expense.id)}&messId=${encodeURIComponent(messId)}`}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[13px] border border-[#008d8c] bg-white text-[13px] font-black text-[#008d8c]"
              >
                <Pencil size={17} />
                Edit Expense
              </Link>
              <button
                type="button"
                onClick={() => void deleteExpense()}
                disabled={deleting}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[13px] border border-[#f04438] bg-[#fffafa] text-[13px] font-black text-[#f04438] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 size={17} />
                {deleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </section>
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}
