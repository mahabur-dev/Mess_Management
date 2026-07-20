'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit3 } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { IconActionLink, StatusPill } from '@/components/mobile/action-links'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { LABELS, PAYMENT_METHODS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { useAuth } from '../providers'

type MemberOption = { id: string; name: string; email: string }

type PaymentItem = {
  id: string
  amount: string | number
  status: PaymentStatus
  method: PaymentMethod
  payment_date?: string
  note?: string | null
  member?: { id: string; name: string }
}

type FormState = {
  monthlyBillId: string
  purchasedBy: string
  amount: string
  method: PaymentMethod
  transactionId: string
  screenshotUrl: string
  note: string
  paymentDate: string
  statusFilter: PaymentStatus
}

const INITIAL_FORM: FormState = {
  monthlyBillId: '',
  purchasedBy: '',
  amount: '',
  method: 'BKASH',
  transactionId: '',
  screenshotUrl: '',
  note: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  statusFilter: 'PENDING',
}

function getStatusTone(status: PaymentStatus) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'warning'
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [items, setItems] = useState<PaymentItem[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
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
    if (!messId) return
    let alive = true

    api
      .getPaymentsByMess(messId, { status: form.statusFilter, limit: 20, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!alive) return
        setItems([])
      })

    return () => {
      alive = false
    }
  }, [messId, form.statusFilter, busy])

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')

    setBusy(true)
    try {
      await api.createPayment({
        messId,
        monthlyBillId: form.monthlyBillId || undefined,
        purchasedBy: form.purchasedBy || undefined,
        amount: Number(form.amount),
        method: form.method,
        transactionId: form.transactionId.trim() || undefined,
        screenshotUrl: form.screenshotUrl.trim() || undefined,
        note: form.note.trim() || undefined,
        paymentDate: form.paymentDate,
      })
      setForm(INITIAL_FORM)
      setMessage('Payment submitted successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit payment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Payments" subtitle="Payment submissions" backHref="/" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Method', LABELS.PAYMENT_METHODS[form.method]],
              ['Status', LABELS.PAYMENT_STATUSES[form.statusFilter]],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#65838b]">{label}</div>
                <div className="mt-1 text-[15px] font-black text-[#123748]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[28px] p-4 space-y-4">
          <TextField
            label="Monthly Bill ID"
            hint="Optional"
            value={form.monthlyBillId}
            onChange={(monthlyBillId) => setForm((prev) => ({ ...prev, monthlyBillId }))}
            placeholder="Bill UUID"
          />
          <SelectField
            label="Purchased By"
            hint="Optional"
            value={form.purchasedBy}
            onChange={(purchasedBy) => setForm((prev) => ({ ...prev, purchasedBy }))}
            options={['', ...members.map((member) => member.id)] as string[]}
            getLabel={(value) => {
              if (!value) return 'Select member'
              const member = members.find((item) => item.id === value)
              return member ? member.name : value
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Amount" value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="2500" type="number" />
            <SelectField
              label="Method"
              value={form.method}
              onChange={(method) => setForm((prev) => ({ ...prev, method }))}
              options={PAYMENT_METHODS}
              getLabel={(value) => LABELS.PAYMENT_METHODS[value]}
            />
          </div>
          <TextField label="Transaction ID" value={form.transactionId} onChange={(transactionId) => setForm((prev) => ({ ...prev, transactionId }))} placeholder="TXN123456" />
          <TextField label="Screenshot URL" value={form.screenshotUrl} onChange={(screenshotUrl) => setForm((prev) => ({ ...prev, screenshotUrl }))} placeholder="https://..." />
          <TextField label="Payment Date" value={form.paymentDate} onChange={(paymentDate) => setForm((prev) => ({ ...prev, paymentDate }))} type="date" />
          <TextAreaField label="Note" value={form.note} onChange={(note) => setForm((prev) => ({ ...prev, note }))} placeholder="Paid for May bill" rows={3} />
          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Submit Payment
          </SubmitButton>
        </div>

        <div className="glass rounded-[28px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="section-title mb-0">Recent</div>
            <SelectField
              label="Filter"
              value={form.statusFilter}
              onChange={(statusFilter) => setForm((prev) => ({ ...prev, statusFilter }))}
              options={PAYMENT_STATUSES}
              getLabel={(value) => LABELS.PAYMENT_STATUSES[value]}
            />
          </div>
          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#cfeeed] bg-white px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold text-[#123748]">{item.member?.name ?? 'Payment'}</div>
                  <div className="mt-1 text-xs text-[#65838b]">{item.payment_date ?? ''}</div>
                  <div className="mt-2">
                    <StatusPill
                      label={LABELS.PAYMENT_STATUSES[item.status]}
                      tone={getStatusTone(item.status)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-sm font-black text-[#008d8c]">BDT {Number(item.amount).toLocaleString()}</div>
                    <div className="text-[11px] text-[#65838b]">{item.method}</div>
                  </div>
                  <IconActionLink
                    href={`/edit-payment?paymentId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                    label="Edit payment"
                    icon={<Edit3 size={16} />}
                  />
                </div>
              </div>
            ))}
            {!items.length ? <div className="py-3 text-sm text-[#65838b]">No payments loaded.</div> : null}
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
