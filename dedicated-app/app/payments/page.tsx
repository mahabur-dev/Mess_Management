'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CircleDollarSign, PlusCircle } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { SelectField, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import {
  DepositListItem,
  DepositManualNotice,
  DepositSectionTitle,
  DepositStatCard,
  DepositSubmitIntro,
  DepositWorkCard,
  PaymentMethodGrid,
  formatDepositMoney,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

type MemberOption = { id: string; name: string; email: string }

type PaymentItem = {
  id: string
  amount: string | number
  status: PaymentStatus
  method: PaymentMethod
  payment_date?: string
  categories?: string[] | null
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
  statusFilter: PaymentStatus | 'ALL'
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
  statusFilter: 'ALL',
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [items, setItems] = useState<PaymentItem[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)

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
      .getPaymentsByMess(messId, {
        status: form.statusFilter === 'ALL' ? undefined : form.statusFilter,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
        setTotalAmount(Number((res as any).totalAmount ?? 0))
      })
      .catch(() => {
        if (!alive) return
        setItems([])
        setTotalAmount(0)
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
      setShowForm(false)
      setMessage('Deposit submitted successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit deposit.')
    } finally {
      setBusy(false)
    }
  }

  const myTotal = useMemo(
    () => items.filter((item) => item.member?.id === user?.id).reduce((total, item) => total + Number(item.amount ?? 0), 0),
    [items, user?.id]
  )
  const pendingTotal = useMemo(
    () => items.filter((item) => item.status === 'PENDING').reduce((total, item) => total + Number(item.amount ?? 0), 0),
    [items]
  )
  return (
    <MobileShell>
      <TopScreen title={showForm ? 'Submit Deposit' : 'Deposit'} subtitle={showForm ? 'Manual entry' : 'Deposit submissions'} backHref="/" />
      <div className="screen space-y-4">
        {!showForm ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <DepositStatCard title="My Deposit" value={formatDepositMoney(myTotal)} caption="This month" />
              <DepositStatCard title="Total Deposit" value={formatDepositMoney(totalAmount)} caption="All deposits" tone="blue" />
              <DepositStatCard title="Pending Deposit" value={formatDepositMoney(pendingTotal)} caption="Waiting approval" tone="orange" />
            </div>

            <DepositWorkCard />
            <DepositManualNotice />
          </>
        ) : null}

        {message && !showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        <div className={showForm ? '' : 'hidden'}>
          <DeferredFormSection
            open={showForm}
            title="Submit Deposit"
            description="Deposits are paid manually first, then entered here."
            actionLabel="Submit Deposit"
            icon={<PlusCircle size={20} />}
            onOpen={() => setShowForm(true)}
            onClose={() => setShowForm(false)}
          >
            <DepositSubmitIntro />
            <PaymentMethodGrid value={form.method} onChange={(method) => setForm((prev) => ({ ...prev, method }))} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Amount" value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="2500" type="number" />
              <TextField label="Deposit Date" value={form.paymentDate} onChange={(paymentDate) => setForm((prev) => ({ ...prev, paymentDate }))} type="date" />
            </div>
            <SelectField
              label="Deposit For"
              hint="Manager only / optional"
              value={form.purchasedBy}
              onChange={(purchasedBy) => setForm((prev) => ({ ...prev, purchasedBy }))}
              options={['', ...members.map((member) => member.id)] as string[]}
              getLabel={(value) => {
                if (!value) return 'Select member'
                const member = members.find((item) => item.id === value)
                return member ? member.name : value
              }}
            />
            <TextField
              label="Monthly Bill ID"
              hint="Optional"
              value={form.monthlyBillId}
              onChange={(monthlyBillId) => setForm((prev) => ({ ...prev, monthlyBillId }))}
              placeholder="Bill UUID"
            />
            <TextField label="Transaction ID" hint="Optional" value={form.transactionId} onChange={(transactionId) => setForm((prev) => ({ ...prev, transactionId }))} placeholder="TXN123456" />
            <TextField label="Screenshot URL" hint="Optional" value={form.screenshotUrl} onChange={(screenshotUrl) => setForm((prev) => ({ ...prev, screenshotUrl }))} placeholder="https://..." />
            <TextAreaField label="Note" value={form.note} onChange={(note) => setForm((prev) => ({ ...prev, note }))} placeholder="Deposit for May bill" rows={3} />
            <DepositManualNotice compact />
            {message && showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}
            <SubmitButton busy={busy} onClick={handleSubmit}>
              Submit Deposit
            </SubmitButton>
          </DeferredFormSection>
        </div>

        {!showForm ? (
          <div className="rounded-[22px] border border-[#dce9ec] bg-white/96 p-4 shadow-[0_12px_28px_rgba(18,55,72,0.08)]">
            <DepositSectionTitle
              title="Recent Deposits"
              action={
                <Link href={appHref('/payments/all')} className="text-label font-semibold text-[#008d8c]">
                  View All Deposit
                </Link>
              }
            />
            <div className="mt-4 space-y-3">
              {items.slice(0, 5).map((item, index) => (
                <DepositListItem
                  key={item.id}
                  item={item as DepositListRecord}
                  index={index}
                  href={`/edit-payment?paymentId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                />
              ))}
              {!items.length ? <div className="rounded-[18px] bg-[#edfafa] p-5 text-label font-semibold text-[#65838b]">No deposits loaded.</div> : null}
            </div>
          </div>
        ) : null}

      </div>
      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} aria-label="Add deposit" title="Add deposit" className="floating-action-link">
          <CircleDollarSign size={25} strokeWidth={2.4} />
        </button>
      ) : null}
    </MobileShell>
  )
}
