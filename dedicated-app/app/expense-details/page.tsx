'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, FileText, MessageSquareText, MoreVertical, Pencil, ReceiptText, Trash2, UserPlus, UserRound } from 'lucide-react'
import {
  CircleIcon,
  HeaderIconButton,
  ScreenHeader,
  categoryIcon,
  categoryLabel,
  categoryTone,
  detailIcons,
  formatDate,
  formatDateTime,
  formatTaka,
  paymentLabel,
} from '@/components/mobile/expense-design'
import { ExpenseMetric, ExpenseSurface, MemberInitials } from '@/components/mobile/expense-ui'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type ExpenseShare = { memberId: string; memberName?: string | null; shareAmount: number; isPayer?: boolean }

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
  purchased_by?: { name?: string | null } | null
  buyer?: { name?: string | null } | null
  created_by?: { name?: string | null } | null
  addedBy?: { name?: string | null } | null
  usedBy?: string | null
  splitMethod?: string | null
  shares?: ExpenseShare[]
  impactSummary?: { payerCredit?: number; sharedCost?: number; includedInMonthlyBill?: boolean }
}

function readableEnum(value?: string | null, fallback = 'Not set') {
  if (!value) return fallback
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof detailIcons.amount; label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]">
        <Icon size={16} strokeWidth={2.3} />
      </span>
      <span className="min-w-0 text-label font-medium text-[#65838b]">{label}</span>
      <span className="max-w-[170px] truncate text-right text-label font-semibold text-[#123748]">{value}</span>
    </div>
  )
}

export default function ExpenseDetailsPage() {
  const router = useRouter()
  const searchParams = useQueryParams()
  const { user } = useAuth()
  const isManager = canManageMess(user)
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? ''
  const [expense, setExpense] = useState<ExpenseRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!expenseId || !messId) return
    let active = true
    setLoading(true)
    setMessage('')

    api
      .getExpenseById(expenseId)
      .then((response) => {
        if (!active) return
        const record = (response.data as ExpenseRecord | null) ?? null
        setExpense(record)
        if (!record) setMessage('Expense not found.')
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Failed to load expense details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [expenseId, messId])

  const details = useMemo(() => {
    if (!expense) return null
    const expenseDate = expense.expenseDate ?? expense.expense_date
    const createdAt = expense.createdAt ?? expense.created_at ?? expenseDate
    return {
      category: categoryLabel(expense.category),
      date: formatDateTime(expenseDate),
      createdAt: formatDateTime(createdAt),
      payment: expense.payment_method || paymentLabel(expense.paymentType),
      usedBy: readableEnum(expense.usedBy, 'All Members'),
      splitMethod: readableEnum(expense.splitMethod, 'Equal Split'),
      purchasedBy: expense.purchased_by?.name || expense.buyer?.name || expense.purchasedBy || 'Not set',
      addedBy: expense.created_by?.name || expense.addedBy?.name || 'Not set',
    }
  }, [expense])

  async function deleteExpense() {
    if (!expenseId || deleting || !window.confirm('Delete this expense permanently?')) return
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
    <MobileShell showBottomNavigation>
      <ScreenHeader
        title="Expense Details"
        subtitle="Understand one expense clearly"
        backHref="/expenses"
        right={<HeaderIconButton label="More actions" icon={<MoreVertical size={19} />} />}
      />

      <div className="screen expense-screen">
        {loading ? <div className="expense-empty-state">Loading expense details...</div> : null}
        {message ? <div className="rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]">{message}</div> : null}

        {expense && details ? (
          <>
            <ExpenseSurface>
              <div className="flex items-center gap-4">
                <CircleIcon icon={Icon} size="lg" tone={tone} className="!h-[64px] !w-[64px]" />
                <div className="min-w-0 flex-1">
                  <div className="text-caption font-semibold text-[#65838b]">Category</div>
                  <div className="mt-1 truncate text-title font-extrabold text-[#123748]">{details.category}</div>
                  <div className="mt-2 inline-flex rounded-full bg-[#e6f7f6] px-2.5 py-1 text-caption font-bold text-[#008d8c]">{details.payment}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-caption font-semibold text-[#65838b]">Amount</div>
                  <div className="mt-1 text-headline font-black text-[#008d8c]">{formatTaka(expense.amount)}</div>
                  <div className="mt-2 flex items-center justify-end gap-1.5 text-caption font-medium text-[#65838b]">
                    <CalendarDays size={14} /> {formatDate(expense.expenseDate ?? expense.expense_date)}
                  </div>
                </div>
              </div>
            </ExpenseSurface>

            <div className="grid grid-cols-2 gap-3">
              <ExpenseSurface className="!p-3">
                <div className="flex items-center gap-2.5">
                  <CircleIcon icon={UserRound} />
                  <div className="min-w-0"><div className="text-caption font-semibold text-[#65838b]">Purchased By</div><div className="mt-1 truncate text-label font-bold text-[#123748]">{details.purchasedBy}</div></div>
                </div>
              </ExpenseSurface>
              <ExpenseSurface className="!p-3">
                <div className="flex items-center gap-2.5">
                  <CircleIcon icon={UserPlus} />
                  <div className="min-w-0"><div className="text-caption font-semibold text-[#65838b]">Added By</div><div className="mt-1 truncate text-label font-bold text-[#123748]">{details.addedBy}</div></div>
                </div>
              </ExpenseSurface>
            </div>

            <ExpenseSurface title="Calculation Information">
              <DetailRow icon={detailIcons.category} label="Category" value={details.category} />
              <DetailRow icon={detailIcons.payment} label="Paid From" value={details.payment} />
              <DetailRow icon={detailIcons.user} label="Used By" value={details.usedBy} />
              <DetailRow icon={detailIcons.amount} label="Split Method" value={details.splitMethod} />
              <DetailRow icon={detailIcons.date} label="Expense Date" value={details.date} />
              <DetailRow icon={detailIcons.added} label="Added On" value={details.createdAt} />
              <DetailRow icon={detailIcons.user} label="Affected Members" value={`${expense.shares?.length ?? 0} Members`} />
            </ExpenseSurface>

            <ExpenseSurface title="Who Shares This">
              <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
                {(expense.shares ?? []).map((share, index) => (
                  <div key={share.memberId} className="flex min-w-0 items-center gap-2 rounded-[14px] border border-[#edf1f4] bg-white p-2">
                    <MemberInitials name={share.memberName} accent={index % 2 ? 'violet' : 'teal'} />
                    <span className="min-w-0 truncate text-caption font-bold text-[#123748]">{share.memberName ?? share.memberId}</span>
                  </div>
                ))}
                {!expense.shares?.length ? <div className="expense-empty-state col-span-full">No member-wise shares recorded.</div> : null}
              </div>
            </ExpenseSurface>

            <ExpenseSurface>
              <div className="flex gap-3">
                <MessageSquareText size={22} className="shrink-0 text-[#008d8c]" />
                <div><h2 className="text-body font-extrabold text-[#123748]">Description</h2><p className="mt-1 text-label text-[#65838b]">{expense.description || 'No description added.'}</p></div>
              </div>
            </ExpenseSurface>

            <ExpenseSurface>
              <div className="flex gap-3">
                <ReceiptText size={22} className="shrink-0 text-[#008d8c]" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-body font-extrabold text-[#123748]">Receipt</h2>
                  {expense.receiptUrl ? (
                    <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 rounded-[14px] border border-dashed border-[#c8d9df] px-3 py-3 text-label font-semibold text-[#65838b]">
                      <FileText size={19} /> <span className="min-w-0 flex-1 truncate">View receipt</span> <ChevronRight size={18} />
                    </a>
                  ) : <p className="mt-1 text-label text-[#65838b]">No receipt uploaded.</p>}
                </div>
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Impact Summary">
              <div className="grid grid-cols-3">
                <ExpenseMetric label="Payer Credit" value={formatTaka(expense.impactSummary?.payerCredit)} />
                <ExpenseMetric label="Shared Cost" value={formatTaka(expense.impactSummary?.sharedCost)} color="#1473e6" />
                <ExpenseMetric label="Included In" value={expense.impactSummary?.includedInMonthlyBill ? 'Monthly Bill' : 'History'} />
              </div>
            </ExpenseSurface>

            {isManager ? (
              <div className="grid grid-cols-2 gap-3 pb-3">
                <Link href={`/edit-expense?expenseId=${encodeURIComponent(expense.id)}&messId=${encodeURIComponent(messId)}`} className="expense-secondary-action"><Pencil size={17} /> Edit Expense</Link>
                <button type="button" onClick={() => void deleteExpense()} disabled={deleting} className="flex min-h-[50px] items-center justify-center gap-2 rounded-[15px] border border-[#f04438] bg-white text-label font-bold text-[#f04438] disabled:opacity-60"><Trash2 size={17} /> {deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}
