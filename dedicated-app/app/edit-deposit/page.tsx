'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { TextAreaField, TextField } from '@/components/mobile/form-controls'
import {
  DepositDetailsSummary,
  DepositInfoRow,
  DepositSectionTitle,
  depositInfoIcons,
  depositMemberName,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type DepositRecord = {
  id: string
  amount: number | string
  date?: string | null
  note?: string | null
  created_at?: string | null
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
      <TopScreen title="Deposit Details" subtitle={deposit?.member?.name ?? 'Update deposit'} backHref="/deposits" />
      <div className="screen space-y-4">
        <DepositDetailsSummary item={{ ...(deposit ?? { id: depositId, amount: 0 }), status: 'APPROVED', method: 'CASH', categories: ['Member Contribution'], payment_date: deposit?.date ?? deposit?.created_at } as DepositListRecord} />

        <div>
          <DepositSectionTitle title="Deposit Information" />
          <section className="mt-3 rounded-[20px] border border-[#dce9ec] bg-white px-4 py-2 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
            <DepositInfoRow icon={depositInfoIcons.submittedBy} label="Submitted By" value={depositMemberName(deposit as DepositListRecord | null)} />
            <DepositInfoRow icon={depositInfoIcons.depositFor} label="Deposit For" value={deposit?.member?.name ?? 'Member'} />
            <DepositInfoRow icon={depositInfoIcons.approval} label="Approval Type" value="Auto approved" />
          </section>
        </div>

        <div className="rounded-[22px] border border-[#d7e8eb] bg-white p-4 shadow-[0_14px_32px_rgba(18,55,72,0.08)] space-y-4">
          <DepositSectionTitle title="Edit Deposit" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Amount" value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="1500" type="number" />
            <TextField label="Date" value={form.date} onChange={(date) => setForm((prev) => ({ ...prev, date }))} type="date" />
          </div>
          <TextAreaField
            label="Note"
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder="Monthly contribution"
            rows={4}
          />

          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => router.push('/deposits')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#00777a]">
              <ArrowLeft size={17} /> Back
            </button>
            <button type="button" onClick={() => void handleSubmit()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-label disabled:opacity-70">
              <Save size={17} /> {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
