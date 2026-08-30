'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, FileText, MessageSquareText, Pencil, ReceiptText, Trash2, UserPlus, UserRound } from 'lucide-react'
import {
  CircleIcon,
  ScreenHeader,
  categoryIcon,
  categoryLabel,
  categoryTone,
  detailIcons,
  formatDateTime,
  paymentLabel,
} from '@/components/mobile/expense-design'
import { ExpenseMetric, ExpenseSurface, MemberAllocationList } from '@/components/mobile/expense-ui'
import {
  ExpenseApprovalBadge,
  ExpenseReviewActions,
  normalizeExpenseApprovalStatus,
  type ExpenseApprovalStatus,
} from '@/components/mobile/expense-approval'
import { ExpenseReviewModal, type ExpenseReviewAction } from '@/components/mobile/expense-review-modal'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'
import {
  expenseSplitMethodLabel,
  expenseUsedByLabel,
  useLocale,
  useLocaleFormatters,
  useLocalizedNotice,
  useTranslations,
} from '@/lib/i18n'

type ExpenseShare = { memberId: string; memberName?: string | null; shareAmount: number; isPayer?: boolean }

type ExpenseRecord = {
  id: string
  category?: string | null
  amount?: string | number | null
  itemName?: string | null
  items?: Array<{
    id?: string
    itemName: string
    quantity?: number | null
    unit?: string | null
    amount: number
  }>
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
  created_by?: { id?: string | null; name?: string | null } | null
  creator?: { id?: string | null; name?: string | null } | null
  createdById?: string | null
  addedBy?: { name?: string | null } | null
  usedBy?: string | null
  splitMethod?: string | null
  status?: string | null
  approvalStatus?: ExpenseApprovalStatus | null
  reviewNote?: string | null
  reviewedAt?: string | null
  shares?: ExpenseShare[]
  impactSummary?: { payerCredit?: number; sharedCost?: number; includedInMonthlyBill?: boolean }
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
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('expenses')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('expenses')
  const reviewNotice = useLocalizedNotice('expenses')
  const router = useRouter()
  const searchParams = useQueryParams()
  const { user } = useAuth()
  const isManager = canManageMess(user)
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? ''
  const [expense, setExpense] = useState<ExpenseRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewFailed, setReviewFailed] = useState(false)
  const [reviewAction, setReviewAction] = useState<ExpenseReviewAction | null>(null)

  useEffect(() => {
    if (!expenseId || !messId) return
    let active = true
    setLoading(true)
    clearNotice()

    api
      .getExpenseById(expenseId)
      .then((response) => {
        if (!active) return
        const record = (response.data as ExpenseRecord | null) ?? null
        setExpense(record)
        if (!record) showMessage('expenseNotFound', 'danger')
      })
      .catch((error) => {
        if (active) showError(error, 'loadExpenseDetailsFailed')
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
      category: categoryLabel(expense.category, locale),
      createdAt: formatDateTime(createdAt, locale),
      payment: paymentLabel(expense.paymentType || expense.payment_method, locale),
      usedBy: expenseUsedByLabel(expense.usedBy || 'ALL_MEMBERS', locale),
      splitMethod: expenseSplitMethodLabel(expense.splitMethod || 'EQUAL', locale),
      purchasedBy: expense.purchased_by?.name || expense.buyer?.name || expense.purchasedBy || t('notSet'),
      addedBy: expense.created_by?.name || expense.addedBy?.name || t('notSet'),
    }
  }, [expense, locale, t])

  async function deleteExpense() {
    if (!expenseId || deleting || !window.confirm(t('deleteExpenseConfirm'))) return
    setDeleting(true)
    clearNotice()
    try {
      await api.deleteExpense(expenseId)
      router.replace('/expenses')
    } catch (error) {
      showError(error, 'deleteExpenseFailed')
      setDeleting(false)
    }
  }

  function openReviewModal(status: ExpenseReviewAction) {
    if (!expenseId || reviewBusy) return
    reviewNotice.clearNotice()
    setReviewFailed(false)
    setReviewAction(status)
  }

  async function reviewExpense(status: ExpenseReviewAction, note: string) {
    if (!expenseId || reviewBusy) return

    setReviewBusy(true)
    reviewNotice.clearNotice()
    setReviewFailed(false)
    try {
      const response = await api.reviewExpense(expenseId, status, note || undefined)
      setExpense(response.data as ExpenseRecord)
      reviewNotice.showMessage(status === 'APPROVED' ? 'expenseApproved' : 'expenseRejected', 'success')
      setReviewAction(null)
    } catch (error) {
      setReviewFailed(true)
      reviewNotice.showError(error, 'reviewExpenseFailed')
    } finally {
      setReviewBusy(false)
    }
  }

  const Icon = categoryIcon(expense?.category)
  const tone = categoryTone(expense?.category)
  const approvalStatus = normalizeExpenseApprovalStatus(expense?.approvalStatus, expense?.status)
  const createdById = expense?.createdById ?? expense?.creator?.id ?? expense?.created_by?.id
  const canEdit = Boolean(expense && (isManager || createdById === user?.id))

  return (
    <MobileShell showBottomNavigation>
      <ScreenHeader
        title={t('expenseDetails')}
        backHref="/expenses"
      />

      <div className="screen expense-screen">
        {loading ? <LoadingIndicator variant="card" label={t('loadingExpenseDetails')} /> : null}
        {notice ? <div className="rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]">{notice.message}</div> : null}

        {expense && details ? (
          <>
            <ExpenseSurface>
              <div className="flex items-center gap-4">
                <CircleIcon icon={Icon} size="lg" tone={tone} className="!h-[64px] !w-[64px]" />
                <div className="min-w-0 flex-1">
                  <div className="text-caption font-semibold text-[#65838b]">{t('category')}</div>
                  <div className="mt-1 truncate text-title font-semibold text-[#1d3a42]">{details.category}</div>
                  <div className="mt-2 inline-flex rounded-full bg-[#e6f7f6] px-2.5 py-1 text-caption font-semibold text-[#008d8c]">{details.payment}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-caption font-semibold text-[#65838b]">{t('amount')}</div>
                  <div className="mt-1 text-headline font-semibold text-[#008d8c]">{format.money(expense.amount)}</div>
                  <div className="mt-2 flex items-center justify-end gap-1.5 text-caption font-medium text-[#65838b]">
                    <CalendarDays size={14} /> {expense.expenseDate || expense.expense_date ? format.date(expense.expenseDate ?? expense.expense_date ?? '') : t('notSet')}
                  </div>
                </div>
              </div>
            </ExpenseSurface>

            {expense.items?.length ? (
              <ExpenseSurface
                title={t('purchasedItems')}
                aside={<span className="ui-badge ui-badge--info">{t(expense.items.length === 1 ? 'itemCount' : 'itemsCount', { count: format.number(expense.items.length) })}</span>}
              >
                <div className="overflow-hidden rounded-[14px] border border-[#e4eaec] bg-white">
                  {expense.items.map((item, index) => (
                    <div key={item.id ?? `${item.itemName}-${index}`} className="flex items-center justify-between gap-3 border-b border-[#edf1f4] px-3 py-3 last:border-b-0">
                      <div className="min-w-0">
                        <div className="truncate text-label font-bold text-[#123748]">{item.itemName}</div>
                        {item.quantity != null ? (
                          <div className="mt-0.5 text-caption font-semibold text-[#65838b]">{item.quantity} {item.unit ?? ''}</div>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-label font-bold text-[#00777a]">{format.money(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </ExpenseSurface>
            ) : null}

            <ExpenseSurface
              title={t('approvalStatus')}
              aside={<ExpenseApprovalBadge status={expense.approvalStatus} recordStatus={expense.status} />}
            >
              <p className="text-label font-semibold text-[#65838b]">
                {approvalStatus === 'PENDING'
                  ? t('waitingManagerReview')
                  : approvalStatus === 'REJECTED'
                    ? t('submissionRejected')
                    : t('approvedDescription')}
              </p>
              {expense.reviewNote ? <p className="mt-2 text-label font-medium text-[#123748]">{expense.reviewNote}</p> : null}
            </ExpenseSurface>

            <div className="grid grid-cols-2 gap-3">
              <ExpenseSurface className="!p-3">
                <div className="flex items-center gap-2.5">
                  <CircleIcon icon={UserRound} />
                  <div className="min-w-0"><div className="text-caption font-semibold text-[#65838b]">{t('paidBy')}</div><div className="mt-1 truncate text-label font-bold text-[#123748]">{details.purchasedBy}</div></div>
                </div>
              </ExpenseSurface>
              <ExpenseSurface className="!p-3">
                <div className="flex items-center gap-2.5">
                  <CircleIcon icon={UserPlus} />
                  <div className="min-w-0"><div className="text-caption font-semibold text-[#65838b]">{t('addedBy')}</div><div className="mt-1 truncate text-label font-bold text-[#123748]">{details.addedBy}</div></div>
                </div>
              </ExpenseSurface>
            </div>

            <ExpenseSurface title={t('calculation')}>
              <DetailRow icon={detailIcons.payment} label={t('paymentSource')} value={details.payment} />
              <DetailRow icon={detailIcons.user} label={t('sharedWith')} value={details.usedBy} />
              <DetailRow icon={detailIcons.amount} label={t('splitRule')} value={details.splitMethod} />
              <DetailRow icon={detailIcons.added} label={t('addedOn')} value={details.createdAt} />
              <DetailRow icon={detailIcons.user} label={t('affectedMembers')} value={t('membersCount', { count: format.number(expense.shares?.length ?? 0) })} />
            </ExpenseSurface>

            {expense.shares?.length ? (
              <ExpenseSurface
                title={t('memberAllocation')}
                aside={<span className="ui-badge ui-badge--info">{t(expense.shares.length === 1 ? 'memberCount' : 'membersCount', { count: format.number(expense.shares.length) })}</span>}
              >
                <MemberAllocationList shares={expense.shares} formatMoney={format.money} />
              </ExpenseSurface>
            ) : null}

            {expense.description ? (
              <ExpenseSurface title={t('note')}>
                <div className="flex gap-3">
                  <MessageSquareText size={20} className="shrink-0 text-[#008d8c]" />
                  <p className="text-label text-[#65838b]">{expense.description}</p>
                </div>
              </ExpenseSurface>
            ) : null}

            {expense.receiptUrl ? (
              <ExpenseSurface title={t('receipt')}>
                <div className="flex gap-3">
                <ReceiptText size={20} className="shrink-0 text-[#008d8c]" />
                <div className="min-w-0 flex-1">
                  <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[14px] border border-dashed border-[#c8d9df] px-3 py-3 text-label font-semibold text-[#65838b]">
                    <FileText size={19} /> <span className="min-w-0 flex-1 truncate">{t('viewReceipt')}</span> <ChevronRight size={18} />
                  </a>
                </div>
              </div>
              </ExpenseSurface>
            ) : null}

            <ExpenseSurface title={t('impactSummary')}>
              <div className="grid grid-cols-3">
                <ExpenseMetric label={t('payerCredit')} value={format.money(expense.impactSummary?.payerCredit)} />
                <ExpenseMetric label={t('sharedCost')} value={format.money(expense.impactSummary?.sharedCost)} color="#00777a" />
                <ExpenseMetric label={t('includedIn')} value={expense.impactSummary?.includedInMonthlyBill ? t('monthlyBill') : t('history')} />
              </div>
            </ExpenseSurface>

            {reviewNotice.notice ? <div className={`ui-notice ${reviewFailed ? 'ui-notice--danger' : 'ui-notice--success'}`}>{reviewNotice.notice.message}</div> : null}

            {isManager && approvalStatus === 'PENDING' ? (
              <ExpenseSurface title={t('managerReview')}>
                <ExpenseReviewActions
                  busy={reviewBusy}
                  onApprove={() => openReviewModal('APPROVED')}
                  onReject={() => openReviewModal('REJECTED')}
                />
              </ExpenseSurface>
            ) : null}

            {canEdit || isManager ? (
              <div className={`grid gap-3 pb-3 ${canEdit && isManager ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {canEdit ? (
                <Link href={`/edit-expense?expenseId=${encodeURIComponent(expense.id)}&messId=${encodeURIComponent(messId)}`} className="expense-secondary-action"><Pencil size={17} /> {t('editExpense')}</Link>
                ) : null}
                {isManager ? <button type="button" onClick={() => void deleteExpense()} disabled={deleting} className="flex min-h-[50px] items-center justify-center gap-2 rounded-[15px] border border-[#f04438] bg-white text-label font-bold text-[#f04438] disabled:opacity-60"><Trash2 size={17} /> {deleting ? t('deleting') : t('deleteExpense')}</button> : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {expense && details && reviewAction ? (
        <ExpenseReviewModal
          action={reviewAction}
          amount={expense.amount}
          category={expense.category}
          itemName={expense.itemName}
          expenseDate={expense.expenseDate ?? expense.expense_date}
          addedBy={details.addedBy}
          purchasedBy={details.purchasedBy}
          busy={reviewBusy}
          error={reviewFailed ? reviewNotice.notice?.message ?? '' : ''}
          onClose={() => {
            if (!reviewBusy) setReviewAction(null)
          }}
          onConfirm={(note) => void reviewExpense(reviewAction, note)}
        />
      ) : null}
    </MobileShell>
  )
}
