'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, PlusCircle, Search, WalletCards } from 'lucide-react'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextField } from '@/components/mobile/form-controls'
import { currentMonthValue, formatMonthLabel, shiftMonthValue } from '@/components/mobile/meals-design'
import {
  DepositLedgerItem,
  DepositLedgerSkeleton,
  DepositManualNotice,
  DepositMonthNavigator,
  DepositOverviewCard,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { DesignedSelect, expenseFormIcons } from '@/components/mobile/expense-design'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
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
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const [items, setItems] = useState<DepositItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(currentMonthValue())

  useAutoDismiss(message, () => setMessage(''))

  useEffect(() => {
    if (!messId) return

    let alive = true
    setLoading(true)
    setLoadError('')
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
        setLoadError('Deposits could not be loaded. Pull to retry or try again shortly.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month, refreshKey])

  async function handleSubmit() {
    setMessage('')
    setMessageTone('error')
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
      setMessageTone('success')
      setMessage('Deposit added successfully.')
      setShowForm(false)
      setRefreshKey((current) => current + 1)
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

  const averageAmount = items.length ? totalAmount / items.length : 0

  return (
    <MobileShell hasFloatingAction>
      <TopScreen title="Deposits" subtitle="Member contribution ledger" backHref="/" />
      <div className="screen deposit-page">
        <DepositMonthNavigator
          month={month}
          label={formatMonthLabel(month)}
          onPrevious={() => setMonth((current) => shiftMonthValue(current, -1))}
          onNext={() => setMonth((current) => shiftMonthValue(current, 1))}
          onChange={setMonth}
        />

        <DepositOverviewCard
          total={totalAmount}
          entries={items.length}
          average={averageAmount}
          monthLabel={formatMonthLabel(month)}
        />

        {message && !showForm ? <div className="deposit-page-message" data-tone={messageTone}>{message}</div> : null}

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
          {message && showForm ? <div className="deposit-page-message" data-tone={messageTone}>{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Add Deposit
          </SubmitButton>
        </DeferredFormSection>

        {!showForm ? (
          <section className="deposit-ledger" aria-labelledby="deposit-ledger-title">
            <div className="deposit-ledger__heading">
              <div>
                <p>TRANSACTION HISTORY</p>
                <h2 id="deposit-ledger-title">Deposit ledger</h2>
              </div>
              <span>{loading ? '—' : `${visibleItems.length} ${visibleItems.length === 1 ? 'entry' : 'entries'}`}</span>
            </div>

            <label className="deposit-ledger__search">
              <Search size={18} strokeWidth={2.2} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member or note"
                aria-label="Search deposits"
              />
            </label>

            <div className="deposit-ledger__list">
              {loading ? <DepositLedgerSkeleton /> : null}
              {!loading && loadError ? (
                <div className="deposit-ledger__empty" data-tone="error">
                  <WalletCards size={24} />
                  <strong>Unable to load ledger</strong>
                  <span>{loadError}</span>
                  <button type="button" onClick={() => setRefreshKey((current) => current + 1)}>Try again</button>
                </div>
              ) : null}
              {!loading && !loadError ? visibleItems.map((item, index) => (
                <DepositLedgerItem
                  key={item.id}
                  item={{ ...item, payment_date: item.date ?? item.created_at } as DepositListRecord}
                  index={index}
                  href={`/edit-deposit?depositId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                />
              )) : null}
              {!loading && !loadError && !visibleItems.length ? (
                <div className="deposit-ledger__empty">
                  <WalletCards size={24} />
                  <strong>{search ? 'No matching deposits' : 'No deposits this month'}</strong>
                  <span>{search ? 'Try a different member name or note.' : 'New contributions will appear here once recorded.'}</span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {!showForm ? (
          <button type="button" onClick={() => setShowForm(true)} className="deposit-floating-action">
            <Plus size={21} strokeWidth={2.6} />
            <span>New deposit</span>
          </button>
        ) : null}
      </div>
    </MobileShell>
  )
}
