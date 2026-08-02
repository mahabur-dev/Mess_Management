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
import { LABELS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'

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
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)

  const depositLabel = useMemo(() => (payment ? LABELS.PAYMENT_STATUSES[payment.status] : 'Deposit'), [payment])
  useEffect(() => {
    if (!paymentId || !messId) return

    let alive = true
    setLoading(true)
    setMessage('')
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
          setMessage('Deposit not found.')
        }
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load deposit details.')
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
    setMessage('')
    if (!paymentId || !messId) return setMessage('Deposit id or mess id is missing.')
    if (!editForm.amount) return setMessage('Amount is required.')

    setBusy(true)
    try {
      await api.updatePayment(paymentId, {
        amount: Number(editForm.amount),
        method: editForm.method,
        paymentDate: editForm.paymentDate,
        transactionId: editForm.transactionId.trim(),
        note: editForm.note.trim(),
      })
      setMessage(isManager ? 'Deposit updated and approved.' : 'Deposit updated and sent for manager approval.')
      router.push('/payments')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update deposit.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReview() {
    setMessage('')
    if (!paymentId || !messId) return setMessage('Deposit id or mess id is missing.')

    setBusy(true)
    try {
      await api.reviewPayment(paymentId, {
        status: reviewForm.status,
        note: reviewForm.note.trim() || undefined,
      })
      router.push('/payments')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to review deposit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Deposit Details" subtitle={payment?.member?.name ?? depositLabel} backHref="/payments" />
      <div className="screen space-y-4">
        {loading ? <LoadingIndicator variant="card" label="Loading deposit details" /> : null}
        {payment ? <DepositDetailsSummary item={payment as DepositListRecord} /> : null}
        {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        {payment ? <div>
          <DepositSectionTitle title="Deposit Information" />
          <section className="mt-3 rounded-[20px] border border-[#dce9ec] bg-white px-4 py-2 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
            <DepositInfoRow icon={depositInfoIcons.submittedBy} label="Submitted By" value={payment?.creator?.name ?? depositMemberName(payment as DepositListRecord | null)} />
            <DepositInfoRow icon={depositInfoIcons.depositFor} label="Deposit For" value={payment?.member?.name ?? 'Self'} />
            <DepositInfoRow
              icon={depositInfoIcons.approval}
              label="Approval Type"
              value={payment?.status === 'APPROVED' ? 'Approved deposit' : payment?.status === 'REJECTED' ? 'Rejected deposit' : 'Needs manager approval'}
            />
          </section>
        </div> : null}

        {canEdit ? (
          <div className="rounded-[22px] border border-[#d7e8eb] bg-white p-4 shadow-[0_14px_32px_rgba(18,55,72,0.08)] space-y-4">
            <DepositSectionTitle title="Edit Deposit" />
            <PaymentMethodGrid value={editForm.method} onChange={(method) => setEditForm((prev) => ({ ...prev, method }))} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Amount" value={editForm.amount} onChange={(amount) => setEditForm((prev) => ({ ...prev, amount }))} placeholder="2500" type="number" />
              <TextField label="Deposit Date" value={editForm.paymentDate} onChange={(paymentDate) => setEditForm((prev) => ({ ...prev, paymentDate }))} type="date" />
            </div>
            <TextField label="Transaction ID" hint="Optional" value={editForm.transactionId} onChange={(transactionId) => setEditForm((prev) => ({ ...prev, transactionId }))} placeholder="TXN123456" />
            <TextAreaField label="Note" value={editForm.note} onChange={(note) => setEditForm((prev) => ({ ...prev, note }))} placeholder="Deposit note" rows={3} />

            {!isManager ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#65838b]">Edited deposits require manager approval.</div> : null}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => router.push('/payments')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#00777a]">
                <ArrowLeft size={17} /> Back
              </button>
              <button type="button" onClick={() => void handleUpdate()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-label disabled:opacity-70">
                <Save size={17} /> {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : null}

        {isManager && payment?.status === 'PENDING' ? (
        <div className="rounded-[22px] border border-[#d7e8eb] bg-white p-4 shadow-[0_14px_32px_rgba(18,55,72,0.08)] space-y-4">
          <DepositSectionTitle title="Review Deposit" />
          <SelectField
            label="Status"
            value={reviewForm.status}
            onChange={(status) => setReviewForm((prev) => ({ ...prev, status }))}
            options={PAYMENT_STATUSES.filter((status) => status !== 'PENDING')}
            getLabel={(value) => LABELS.PAYMENT_STATUSES[value]}
          />
          <TextAreaField
            label="Note"
            value={reviewForm.note}
            onChange={(note) => setReviewForm((prev) => ({ ...prev, note }))}
            placeholder="Deposit review note or admin comment"
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => router.push('/payments')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#00777a]">
              <ArrowLeft size={17} /> Back
            </button>
            <button type="button" onClick={() => void handleReview()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-label disabled:opacity-70">
              <Save size={17} /> {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        ) : null}
      </div>
    </MobileShell>
  )
}
