'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, CreditCard, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SelectField, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { DatePicker } from '@/components/mobile/date-picker'
import { Button } from '@/components/ui/button'
import {
  DepositDetailsSummary,
  DepositInfoRow,
  DepositSectionTitle,
  depositInfoIcons,
  formatDepositDate,
  depositMemberName,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { PAYMENT_METHODS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'
import { paymentMethodLabel, paymentStatusLabel, useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type PaymentRecord = {
  id: string
  amount: string | number
  status: PaymentStatus
  method: PaymentMethod
  transaction_id?: string | null
  payment_date?: string | null
  created_at?: string | null
  approved_at?: string | null
  categories?: string[] | null
  note?: string | null
  member?: { id: string; name: string }
  creator?: { id: string; name: string }
}

type EditFormState = {
  amount: string
  method: PaymentMethod
  paymentDate: string
  transactionId: string
  note: string
}

type ReviewFormState = {
  status: PaymentStatus
  note: string
}

function DepositActionRow({
  backLabel,
  submitLabel,
  busyLabel,
  busy,
  onBack,
  onSubmit,
}: {
  backLabel: string
  submitLabel: string
  busyLabel: string
  busy: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
        <ArrowLeft size={17} aria-hidden="true" /> {backLabel}
      </Button>
      <Button type="button" className="w-full" busy={busy} busyLabel={busyLabel} onClick={onSubmit}>
        <Save size={17} aria-hidden="true" /> {submitLabel}
      </Button>
    </div>
  )
}

export default function EditPaymentPage() {
  const { locale } = useLocale()
  const t = useTranslations('payments')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('payments')
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const paymentId = searchParams.get('paymentId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''
  const isManager = canManageMess(user)

  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    amount: '',
    method: 'BKASH',
    paymentDate: '',
    transactionId: '',
    note: '',
  })
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    status: 'PENDING',
    note: '',
  })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)

  const depositLabel = useMemo(() => (payment ? paymentStatusLabel(payment.status, locale) : t('deposit')), [locale, payment, t])
  useEffect(() => {
    if (!paymentId || !messId) return

    let alive = true
    setLoading(true)
    clearNotice()
    api
      .getPaymentById(paymentId)
      .then((res) => {
        if (!alive) return
        const found = (res.data ?? null) as PaymentRecord | null
        setPayment(found)
        if (found) {
          setEditForm({
            amount: String(found.amount ?? ''),
            method: found.method ?? 'BKASH',
            paymentDate: (found.payment_date ?? found.created_at ?? '').slice(0, 10),
            transactionId: found.transaction_id ?? '',
            note: found.note ?? '',
          })
          setReviewForm({
            status: found.status ?? 'PENDING',
            note: '',
          })
        } else {
          showMessage('depositNotFound', 'danger')
        }
      })
      .catch((error) => {
        if (!alive) return
        showError(error, 'loadDepositDetailsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [paymentId, messId])

  const canEdit = Boolean(payment && (isManager || payment.creator?.id === user?.id))

  async function handleUpdate() {
    clearNotice()
    if (!paymentId || !messId) return showMessage('missingDepositContext', 'danger')
    if (!editForm.amount) return showMessage('amountRequired', 'danger')

    setBusy(true)
    try {
      await api.updatePayment(paymentId, {
        amount: Number(editForm.amount),
        method: editForm.method,
        paymentDate: editForm.paymentDate,
        transactionId: editForm.transactionId.trim(),
        note: editForm.note.trim(),
      })
      showMessage(isManager ? 'updateDepositApproved' : 'updateDepositSubmitted', 'success')
      router.push('/payments')
    } catch (error) {
      showError(error, 'updateDepositFailed')
    } finally {
      setBusy(false)
    }
  }

  async function handleReview() {
    clearNotice()
    if (!paymentId || !messId) return showMessage('missingDepositContext', 'danger')

    setBusy(true)
    try {
      await api.reviewPayment(paymentId, {
        status: reviewForm.status,
        note: reviewForm.note.trim() || undefined,
      })
      router.push('/payments')
    } catch (error) {
      showError(error, 'reviewDepositFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('depositDetails')} subtitle={payment?.member?.name ?? depositLabel} backHref="/payments" />
      <div className="screen space-y-4">
        {loading ? <LoadingIndicator variant="card" label={t('loadingDepositDetails')} /> : null}
        {payment ? <DepositDetailsSummary item={payment as DepositListRecord} /> : null}
        {notice ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{notice.message}</div> : null}

        {payment ? <div>
          <DepositSectionTitle title={t('depositInformation')} />
          <section className="app-list mt-3">
            <DepositInfoRow icon={depositInfoIcons.submittedBy} label={t('submittedBy')} value={payment?.creator?.name ?? depositMemberName(payment as DepositListRecord | null, locale)} />
            <DepositInfoRow icon={depositInfoIcons.depositFor} label={t('depositFor')} value={payment?.member?.name ?? t('self')} />
            <DepositInfoRow
              icon={depositInfoIcons.approval}
              label={t('approvalType')}
              value={payment?.status === 'APPROVED' ? t('approvedDeposit') : payment?.status === 'REJECTED' ? t('rejectedDeposit') : t('needsApproval')}
            />
          </section>
        </div> : null}

        {canEdit ? (
          <section className="deposit-detail-editor space-y-4">
            <DepositSectionTitle title={t('editDeposit')} />
            <SelectField
              label={t('depositMethod')}
              value={editForm.method}
              onChange={(method) => setEditForm((prev) => ({ ...prev, method }))}
              options={PAYMENT_METHODS}
              getLabel={(method) => paymentMethodLabel(method, locale)}
              icon={CreditCard}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={t('amount')} value={editForm.amount} onChange={(amount) => setEditForm((prev) => ({ ...prev, amount }))} placeholder="2500" type="number" />
              <DatePicker
                label={t('depositDate')}
                value={editForm.paymentDate}
                onChange={(paymentDate) => setEditForm((prev) => ({ ...prev, paymentDate }))}
                renderTrigger={({ buttonProps }) => (
                  <FieldCard label={t('depositDate')}>
                    <button {...buttonProps} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-[#bfe7e6] bg-white px-4 text-left text-body font-semibold text-[#123748] outline-none transition focus-visible:border-[#008d8c] focus-visible:ring-4 focus-visible:ring-[#008d8c]/10">
                      <CalendarDays size={18} className="shrink-0 text-[#008d8c]" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{formatDepositDate(editForm.paymentDate, locale)}</span>
                    </button>
                  </FieldCard>
                )}
              />
            </div>
            <TextField label={t('transactionId')} hint={t('optional')} value={editForm.transactionId} onChange={(transactionId) => setEditForm((prev) => ({ ...prev, transactionId }))} placeholder={t('transactionPlaceholder')} />
            <TextAreaField label={t('note')} value={editForm.note} onChange={(note) => setEditForm((prev) => ({ ...prev, note }))} placeholder={t('notePlaceholder')} rows={3} />

            {!isManager ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#65838b]">{t('editedRequiresApproval')}</div> : null}
            <DepositActionRow backLabel={t('back')} submitLabel={t('save')} busyLabel={t('saving')} busy={busy} onBack={() => router.push('/payments')} onSubmit={() => void handleUpdate()} />
          </section>
        ) : null}

        {isManager && payment?.status === 'PENDING' ? (
        <section className="deposit-detail-editor space-y-4">
          <DepositSectionTitle title={t('reviewDeposit')} />
          <SelectField
            label={t('status')}
            value={reviewForm.status}
            onChange={(status) => setReviewForm((prev) => ({ ...prev, status }))}
            options={PAYMENT_STATUSES.filter((status) => status !== 'PENDING')}
            getLabel={(value) => paymentStatusLabel(value, locale)}
          />
          <TextAreaField
            label={t('note')}
            value={reviewForm.note}
            onChange={(note) => setReviewForm((prev) => ({ ...prev, note }))}
            placeholder={t('reviewNotePlaceholder')}
            rows={4}
          />

          <DepositActionRow backLabel={t('back')} submitLabel={t('save')} busyLabel={t('saving')} busy={busy} onBack={() => router.push('/payments')} onSubmit={() => void handleReview()} />
        </section>
        ) : null}
      </div>
    </MobileShell>
  )
}
