'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CircleDollarSign, Hourglass, PlusCircle, UserRound, WalletCards } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { DesignedSelect, expenseFormIcons } from '@/components/mobile/expense-design'
import { MealMonthSelector, currentMonthValue } from '@/components/mobile/meals-design'
import {
  DepositListItem,
  DepositManualNotice,
  DepositSectionTitle,
  DepositStatCard,
  DepositStatPanel,
  PaymentMethodGrid,
  formatDepositMoney,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { appHref } from '@/lib/routes'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'

type PaymentItem = {
  id: string
  amount: string | number
  status: PaymentStatus
  method: PaymentMethod
  payment_date?: string
  categories?: string[] | null
  note?: string | null
  member?: { id: string; name: string; avatar_url?: string | null }
}

type FormState = {
  purchasedBy: string
  amount: string
  method: PaymentMethod
  transactionId: string
  note: string
  paymentDate: string
}

type DepositSummary = {
  approved: number
  myApproved: number
  pending: number
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10)
}

function createInitialForm(paymentDate = ''): FormState {
  return {
    purchasedBy: '',
    amount: '',
    method: 'BKASH',
    transactionId: '',
    note: '',
    paymentDate,
  }
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const isManager = canManageMess(user)
  const [items, setItems] = useState<PaymentItem[]>([])
  const [form, setForm] = useState<FormState>(() => createInitialForm())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [summary, setSummary] = useState<DepositSummary>({ approved: 0, myApproved: 0, pending: 0 })
  const [month, setMonth] = useState(currentMonthValue())

  useAutoDismiss(message, () => setMessage(''))

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)

    Promise.all([
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, limit: 20, sortBy: 'payment_date', sortOrder: 'desc' }),
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, status: 'APPROVED', limit: 1 }),
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, status: 'PENDING', limit: 1 }),
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, status: 'APPROVED', memberId: user?.id, limit: 1 }),
    ])
      .then(([recentRes, approvedRes, pendingRes, myApprovedRes]) => {
        if (!alive) return
        setItems(Array.isArray(recentRes.data) ? recentRes.data : [])
        setSummary({
          approved: Number((approvedRes as { totalAmount?: number }).totalAmount ?? 0),
          pending: Number((pendingRes as { totalAmount?: number }).totalAmount ?? 0),
          myApproved: Number((myApprovedRes as { totalAmount?: number }).totalAmount ?? 0),
        })
      })
      .catch(() => {
        if (!alive) return
        setItems([])
        setSummary({ approved: 0, myApproved: 0, pending: 0 })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, user?.id, busy, month])

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')

    setBusy(true)
    try {
      await api.createPayment({
        messId,
        purchasedBy: form.purchasedBy || undefined,
        amount: Number(form.amount),
        method: form.method,
        transactionId: form.transactionId.trim() || undefined,
        note: form.note.trim() || undefined,
        paymentDate: form.paymentDate,
      })
      setForm(createInitialForm())
      setShowForm(false)
      setMessage(isManager ? 'Deposit added and approved.' : 'Deposit submitted for manager approval.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit deposit.')
    } finally {
      setBusy(false)
    }
  }

  function openDepositForm() {
    setForm((current) => (current.paymentDate ? current : { ...current, paymentDate: todayDateValue() }))
    setShowForm(true)
  }

  return (
    <MobileShell>
      <TopScreen title={showForm ? 'Submit Deposit' : 'Deposit'} subtitle={showForm ? 'Manual entry' : 'Deposit submissions'} backHref="/" />
      <div className="screen space-y-4">
        {!showForm ? (
          <>
            <MealMonthSelector month={month} onChange={setMonth} />

            <DepositStatPanel>
              <DepositStatCard title="My Deposit" value={loading ? <LoadingIndicator size="sm" label="Loading my deposit" /> : formatDepositMoney(summary.myApproved)} icon={UserRound} compact />
              <DepositStatCard title="Total Deposit" value={loading ? <LoadingIndicator size="sm" label="Loading total deposit" /> : formatDepositMoney(summary.approved)} icon={WalletCards} tone="blue" compact />
              <DepositStatCard title="Pending Deposit" value={loading ? <LoadingIndicator size="sm" label="Loading pending deposit" /> : formatDepositMoney(summary.pending)} icon={Hourglass} tone="orange" compact />
            </DepositStatPanel>
          </>
        ) : null}

        {message && !showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        {showForm ? (
          <DeferredFormSection
            open={showForm}
            title="Submit Deposit"
            description="Deposits are paid manually first, then entered here."
            actionLabel="Submit Deposit"
            icon={<PlusCircle size={20} />}
            onOpen={openDepositForm}
            onClose={() => setShowForm(false)}
          >
            <PaymentMethodGrid value={form.method} onChange={(method) => setForm((prev) => ({ ...prev, method }))} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Amount" value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="2500" type="number" />
              <TextField label="Deposit Date" value={form.paymentDate} onChange={(paymentDate) => setForm((prev) => ({ ...prev, paymentDate }))} type="date" />
            </div>
            {isManager ? (
              <DesignedSelect
                label="Deposit For"
                icon={expenseFormIcons.member}
                value={form.purchasedBy}
                onChange={(event) => setForm((prev) => ({ ...prev, purchasedBy: event.target.value }))}
              >
                <option value="">Self</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </DesignedSelect>
            ) : null}
            <TextField label="Transaction ID" hint="Optional" value={form.transactionId} onChange={(transactionId) => setForm((prev) => ({ ...prev, transactionId }))} placeholder="TXN123456" />
            <TextAreaField label="Note" value={form.note} onChange={(note) => setForm((prev) => ({ ...prev, note }))} placeholder="Deposit for May bill" rows={3} />
            <DepositManualNotice compact />
            {message && showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}
            <SubmitButton busy={busy} onClick={handleSubmit}>
              Submit Deposit
            </SubmitButton>
          </DeferredFormSection>
        ) : null}

        {!showForm ? (
          <section className="app-section">
            <DepositSectionTitle
              title="Recent Deposits"
              action={
                <Link href={appHref(`/payments/all?month=${encodeURIComponent(month)}`)} className="text-label font-semibold text-[#008d8c]">
                  View All
                </Link>
              }
            />
            <div className="flush-list flush-list--panel mt-4">
              {loading ? <LoadingIndicator variant="card" label="Loading deposits" className="mx-4 !w-auto" /> : null}
              {!loading && items.slice(0, 5).map((item, index) => (
                <DepositListItem
                  key={item.id}
                  item={item as DepositListRecord}
                  index={index}
                  href={`/edit-payment?paymentId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                  variant="horizontal"
                />
              ))}
              {!loading && !items.length ? <div className="mx-4 rounded-[12px] bg-[#edfafa] p-5 text-label font-semibold text-[#65838b]">No deposits found.</div> : null}
            </div>
          </section>
        ) : null}

      </div>
      {!showForm ? (
        <button type="button" onClick={openDepositForm} aria-label="Add deposit" title="Add deposit" className="floating-action-link">
          <CircleDollarSign size={25} strokeWidth={2.4} />
        </button>
      ) : null}
    </MobileShell>
  )
}
