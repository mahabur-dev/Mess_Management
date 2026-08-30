'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { SelectField, TextAreaField, TextField } from '@/components/mobile/form-controls'
import {
  DepositDetailsSummary,
  DepositInfoRow,
  DepositSectionTitle,
  PaymentMethodGrid,
  depositInfoIcons,
  depositMemberName,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'
import { paymentStatusLabel, useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

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

  useAutoDismiss(notice?.message ?? '', clearNotice)

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
          <section className="app-section app-form-section space-y-4">
            <DepositSectionTitle title={t('editDeposit')} />
            <PaymentMethodGrid value={editForm.method} onChange={(method) => setEditForm((prev) => ({ ...prev, method }))} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={t('amount')} value={editForm.amount} onChange={(amount) => setEditForm((prev) => ({ ...prev, amount }))} placeholder="2500" type="number" />
              <TextField label={t('depositDate')} value={editForm.paymentDate} onChange={(paymentDate) => setEditForm((prev) => ({ ...prev, paymentDate }))} type="date" />
            </div>
            <TextField label={t('transactionId')} hint={t('optional')} value={editForm.transactionId} onChange={(transactionId) => setEditForm((prev) => ({ ...prev, transactionId }))} placeholder={t('transactionPlaceholder')} />
            <TextAreaField label={t('note')} value={editForm.note} onChange={(note) => setEditForm((prev) => ({ ...prev, note }))} placeholder={t('notePlaceholder')} rows={3} />

            {!isManager ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#65838b]">{t('editedRequiresApproval')}</div> : null}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => router.push('/payments')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#00777a]">
                <ArrowLeft size={17} /> {t('back')}
              </button>
              <button type="button" onClick={() => void handleUpdate()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-label disabled:opacity-70">
                <Save size={17} /> {busy ? t('saving') : t('save')}
              </button>
            </div>
          </section>
        ) : null}

        {isManager && payment?.status === 'PENDING' ? (
        <section className="app-section app-form-section space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => router.push('/payments')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#00777a]">
              <ArrowLeft size={17} /> {t('back')}
            </button>
            <button type="button" onClick={() => void handleReview()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-label disabled:opacity-70">
              <Save size={17} /> {busy ? t('saving') : t('save')}
            </button>
          </div>
        </section>
        ) : null}
      </div>
    </MobileShell>
  )
}
