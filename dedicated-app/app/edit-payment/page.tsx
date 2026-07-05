'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { LABELS, PAYMENT_STATUSES, type PaymentStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type PaymentRecord = {
  id: string
  amount: string | number
  status: PaymentStatus
  method?: string
  payment_date?: string | null
  note?: string | null
  member?: { id: string; name: string }
}

type FormState = {
  status: PaymentStatus
  note: string
}

export default function EditPaymentPage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const paymentId = searchParams.get('paymentId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''

  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [form, setForm] = useState<FormState>({
    status: 'PENDING',
    note: '',
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const paymentLabel = useMemo(() => (payment ? LABELS.PAYMENT_STATUSES[payment.status] : 'Payment'), [payment])

  useEffect(() => {
    if (!paymentId || !messId) return

    let alive = true
    api
      .getPaymentsByMess(messId, { limit: 500, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? (res.data as PaymentRecord[]) : []
        const found = list.find((item) => item.id === paymentId) ?? null
        setPayment(found)
        if (found) {
          setForm({
            status: found.status ?? 'PENDING',
            note: found.note ?? '',
          })
        } else {
          setMessage('Payment not found.')
        }
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load payment details.')
      })

    return () => {
      alive = false
    }
  }, [paymentId, messId])

  async function handleSubmit() {
    setMessage('')
    if (!paymentId || !messId) return setMessage('Payment id or mess id is missing.')

    setBusy(true)
    try {
      await api.reviewPayment(paymentId, {
        status: form.status,
        note: form.note.trim() || undefined,
      })
      setMessage('Payment updated successfully.')
      router.push('/payments')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update payment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Payment" subtitle={payment?.member?.name ?? paymentLabel} backHref="/payments" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <div className="rounded-2xl bg-[#f7fbfd] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667b8a]">Payment</div>
            <div className="mt-1 text-sm font-black text-[#14324a]">{payment?.member?.name ?? paymentId}</div>
            <div className="mt-1 text-xs text-[#667b8a]">
              {payment?.payment_date ?? 'No date'} - BDT {Number(payment?.amount ?? 0).toLocaleString()}
            </div>
          </div>

          <SelectField
            label="Status"
            value={form.status}
            onChange={(status) => setForm((prev) => ({ ...prev, status }))}
            options={PAYMENT_STATUSES}
            getLabel={(value) => LABELS.PAYMENT_STATUSES[value]}
          />
          <TextAreaField
            label="Note"
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder="Review note or admin comment"
            rows={4}
          />

          {message ? <div className="rounded-2xl border border-[#cfe3ff] bg-[#e7f1ff] px-4 py-3 text-sm font-semibold text-[#0f7e86]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Changes
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
