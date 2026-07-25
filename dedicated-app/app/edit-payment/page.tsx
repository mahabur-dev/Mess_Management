'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, TextAreaField } from '@/components/mobile/form-controls'
import {
  DepositDetailsSummary,
  DepositInfoRow,
  DepositSectionTitle,
  depositInfoIcons,
  depositMemberName,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
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
  created_at?: string | null
  approved_at?: string | null
  categories?: string[] | null
  note?: string | null
  member?: { id: string; name: string }
  creator?: { id: string; name: string }
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

  const depositLabel = useMemo(() => (payment ? LABELS.PAYMENT_STATUSES[payment.status] : 'Deposit'), [payment])
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
          setMessage('Deposit not found.')
        }
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load deposit details.')
      })

    return () => {
      alive = false
    }
  }, [paymentId, messId])

  async function handleSubmit() {
    setMessage('')
    if (!paymentId || !messId) return setMessage('Deposit id or mess id is missing.')

    setBusy(true)
    try {
      await api.reviewPayment(paymentId, {
        status: form.status,
        note: form.note.trim() || undefined,
      })
      setMessage('Deposit updated successfully.')
      router.push('/payments')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update deposit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Deposit Details" subtitle={payment?.member?.name ?? depositLabel} backHref="/payments" />
      <div className="screen space-y-4">
        <DepositDetailsSummary item={payment as DepositListRecord | null} />

        <div>
          <DepositSectionTitle title="Deposit Information" />
          <section className="mt-3 rounded-[20px] border border-[#dce9ec] bg-white px-4 py-2 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
            <DepositInfoRow icon={depositInfoIcons.submittedBy} label="Submitted By" value={payment?.creator?.name ?? depositMemberName(payment as DepositListRecord | null)} />
            <DepositInfoRow icon={depositInfoIcons.depositFor} label="Deposit For" value={payment?.member?.name ?? 'Self'} />
            <DepositInfoRow icon={depositInfoIcons.approval} label="Approval Type" value={payment?.status === 'APPROVED' ? 'Approved deposit' : 'Needs manager approval'} />
          </section>
        </div>

        <div className="rounded-[22px] border border-[#d7e8eb] bg-white p-4 shadow-[0_14px_32px_rgba(18,55,72,0.08)] space-y-4">
          <DepositSectionTitle title="Review Deposit" />
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
            placeholder="Deposit review note or admin comment"
            rows={4}
          />

          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => router.push('/payments')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-[13px] font-black text-[#00777a]">
              <ArrowLeft size={17} /> Back
            </button>
            <button type="button" onClick={() => void handleSubmit()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-[13px] disabled:opacity-70">
              <Save size={17} /> {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
