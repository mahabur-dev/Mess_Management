'use client'

import { useEffect, useMemo, useState } from 'react'
import { Coins, Edit3, PlusCircle } from 'lucide-react'
import { IconActionLink } from '@/components/mobile/action-links'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
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
  amount: string
  date: string
  note: string
}

const INITIAL_FORM: FormState = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

export default function DepositsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<DepositItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    if (!messId) return

    let alive = true
    api
      .getDepositsByMess(messId, { limit: 20, sortBy: 'date', sortOrder: 'desc' })
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
  }, [messId, busy])

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')

    setBusy(true)
    try {
      await api.createDeposit({
        messId,
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim() || undefined,
      })
      setForm(INITIAL_FORM)
      setMessage('Deposit added successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add deposit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Deposits" subtitle="Contribution tracking" backHref="/" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#667b8a]">Total Deposit</div>
                  <div className="mt-1 text-lg font-black text-[#14324a]">BDT {Number(totalAmount).toLocaleString()}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1e6]/12 text-[#fc782d]">
                  <Coins size={18} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#667b8a]">Recent</div>
                  <div className="mt-1 text-lg font-black text-[#14324a]">{items.length}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1e6]/12 text-[#fc782d]">
                  <PlusCircle size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[28px] p-4 space-y-4">
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
          <TextAreaField
            label="Note"
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder="Monthly contribution"
            rows={3}
          />
          {message ? <div className="rounded-2xl border border-[#ffd8c0] bg-[#fff4ea] px-4 py-3 text-sm font-semibold text-[#fc782d]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Add Deposit
          </SubmitButton>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass flex items-center justify-between gap-3 rounded-[24px] p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-[#14324a]">{item.member?.name ?? 'Deposit'}</div>
                <div className="mt-1 text-xs text-[#667b8a]">{item.date ?? item.created_at ?? ''}</div>
                {item.note ? <div className="mt-1 text-xs text-[#667b8a]">{item.note}</div> : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-black text-[#fc782d]">BDT {Number(item.amount).toLocaleString()}</div>
                <IconActionLink
                  href={`/edit-deposit?depositId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                  label="Edit deposit"
                  icon={<Edit3 size={16} />}
                />
              </div>
            </div>
          ))}
          {!items.length ? <div className="rounded-[24px] bg-white/85 p-6 text-sm text-[#667b8a]">No deposits loaded.</div> : null}
        </div>
      </div>
    </MobileShell>
  )
}
