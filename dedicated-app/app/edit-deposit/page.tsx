'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type DepositRecord = {
  id: string
  amount: number | string
  date?: string | null
  note?: string | null
  member?: { id: string; name: string; email?: string }
}

type FormState = {
  amount: string
  date: string
  note: string
}

export default function EditDepositPage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const depositId = searchParams.get('depositId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''

  const [deposit, setDeposit] = useState<DepositRecord | null>(null)
  const [form, setForm] = useState<FormState>({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!depositId || !messId) return

    let alive = true
    api
      .getDepositById(depositId)
      .then((res) => {
        if (!alive) return
        const found = (res.data ?? null) as DepositRecord | null
        setDeposit(found)
        if (!found) {
          setMessage('Deposit not found.')
          return
        }
        setForm({
          amount: found.amount ? String(found.amount) : '',
          date: found.date ?? new Date().toISOString().slice(0, 10),
          note: found.note ?? '',
        })
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load deposit details.')
      })

    return () => {
      alive = false
    }
  }, [depositId, messId])

  async function handleSubmit() {
    setMessage('')
    if (!depositId || !messId) return setMessage('Deposit id or mess id is missing.')
    if (!form.amount) return setMessage('Amount is required.')

    setBusy(true)
    try {
      await api.updateDeposit(depositId, {
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim() || undefined,
      })
      setMessage('Deposit updated successfully.')
      router.push('/deposits')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update deposit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Deposit" subtitle={deposit?.member?.name ?? 'Update deposit'} backHref="/deposits" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <div className="rounded-2xl bg-[#f7fbfd] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667b8a]">Deposit</div>
            <div className="mt-1 text-sm font-black text-[#14324a]">{deposit?.member?.name ?? depositId}</div>
            <div className="mt-1 text-xs text-[#667b8a]">BDT {Number(deposit?.amount ?? 0).toLocaleString()}</div>
          </div>

          <TextField label="Amount" value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="1500" type="number" />
          <TextField label="Date" value={form.date} onChange={(date) => setForm((prev) => ({ ...prev, date }))} type="date" />
          <TextAreaField
            label="Note"
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder="Monthly contribution"
            rows={4}
          />

          {message ? <div className="rounded-2xl border border-[#ffd8c0] bg-[#fff4ea] px-4 py-3 text-sm font-semibold text-[#fc782d]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Changes
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
