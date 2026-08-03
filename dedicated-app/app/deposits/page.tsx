'use client'

import { useEffect, useMemo, useState } from 'react'
import { Coins, ListChecks, PlusCircle } from 'lucide-react'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import { MealMonthSelector, currentMonthValue, formatMonthLabel } from '@/components/mobile/meals-design'
import {
  DepositListItem,
  DepositManualNotice,
  DepositSectionTitle,
  DepositStatCard,
  formatDepositMoney,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { DesignedSelect, expenseFormIcons } from '@/components/mobile/expense-design'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'

type DepositItem = {
  id: string
  amount: number | string
  date?: string
  note?: string | null
  created_at?: string
  member?: { id: string; name: string }
}

type FormState = {
  memberId: string
  amount: string
  date: string
  note: string
}

const INITIAL_FORM: FormState = {
  memberId: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

export default function DepositsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<DepositItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(currentMonthValue())

  useEffect(() => {
    if (!messId) return

    let alive = true
    api
      .getDepositsByMess(messId, { billMonth: `${month}-01`, limit: 100, sortBy: 'date', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
        setTotalAmount((res as any).totalAmount ?? 0)
      })
      .catch(() => {
        if (!alive) return
        setItems([])
        setTotalAmount(0)
      })

    return () => {
      alive = false
    }
  }, [messId, busy, month])

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.memberId) return setMessage('Select the member receiving this deposit.')
    if (!form.amount) return setMessage('Amount is required.')

    setBusy(true)
    try {
      await api.createDeposit({
        messId,
        memberId: form.memberId || undefined,
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim() || undefined,
      })
      setForm(INITIAL_FORM)
      setMessage('Deposit added successfully.')
      setShowForm(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add deposit.')
    } finally {
      setBusy(false)
    }
  }

  const visibleItems = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return items
    return items.filter((item) => `${item.member?.name ?? ''} ${item.note ?? ''}`.toLowerCase().includes(value))
  }, [items, search])

  return (
    <MobileShell>
      <TopScreen title="Deposits" subtitle="Contribution tracking" backHref="/" />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />

        <div className="grid grid-cols-2 gap-3">
          <DepositStatCard title="Total Deposit" value={formatDepositMoney(totalAmount)} caption={formatMonthLabel(month)} icon={Coins} />
          <DepositStatCard title="Entries" value={items.length} caption={formatMonthLabel(month)} icon={ListChecks} tone="blue" />
        </div>

        {message && !showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        <DeferredFormSection
          open={showForm}
          title="Add Deposit"
          description="Record a member contribution only when you need a new entry."
          actionLabel="Add Deposit"
          icon={<PlusCircle size={20} />}
          onOpen={() => setShowForm(true)}
          onClose={() => setShowForm(false)}
        >
          <DesignedSelect
            label="Deposit For"
            icon={expenseFormIcons.member}
            value={form.memberId}
            onChange={(event) => setForm((prev) => ({ ...prev, memberId: event.target.value }))}
            required
          >
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </DesignedSelect>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Amount"
              value={form.amount}
              onChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
              placeholder="1500"
              type="number"
            />
            <TextField
              label="Date"
              value={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
              type="date"
            />
          </div>
          <TextField
            label="Note"
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder="Monthly contribution"
          />
          <DepositManualNotice compact />
          {message && showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Add Deposit
          </SubmitButton>
        </DeferredFormSection>

        <section className="rounded-[22px] border border-[#dce9ec] bg-white/96 p-4 shadow-[0_12px_28px_rgba(18,55,72,0.08)]">
          <DepositSectionTitle
            title={`Deposits (${formatMonthLabel(month)})`}
            action={<button type="button" onClick={() => setShowForm(true)} className="text-label font-semibold text-[#008d8c]">Add</button>}
          />
          <input
            className="mt-4 h-12 w-full rounded-[15px] border border-[#dce9ec] bg-white px-4 text-body font-medium outline-none placeholder:text-[#7c8b98] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member or note..."
          />
          <div className="flush-list flush-list--panel mt-3">
            {visibleItems.map((item, index) => (
              <DepositListItem
                key={item.id}
                item={{ ...item, status: 'APPROVED', method: 'CASH', payment_date: item.date ?? item.created_at } as DepositListRecord}
                index={index}
                href={`/edit-deposit?depositId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                variant="horizontal"
              />
            ))}
            {!visibleItems.length ? <div className="mx-4 rounded-[18px] bg-[#edfafa] p-5 text-label font-semibold text-[#65838b]">No deposits loaded.</div> : null}
          </div>
        </section>

        {!showForm ? (
          <button type="button" onClick={() => setShowForm(true)} className="primary-btn flex w-full items-center justify-center gap-2 rounded-[22px] text-body">
            <PlusCircle size={21} /> Add Deposit
          </button>
        ) : null}
      </div>
    </MobileShell>
  )
}
