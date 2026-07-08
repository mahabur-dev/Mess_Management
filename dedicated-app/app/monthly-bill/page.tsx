'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Edit3 } from 'lucide-react'
import { IconActionLink } from '@/components/mobile/action-links'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { BILL_STATUSES, LABELS, type BillStatus } from '@/lib/form-options'
import { useAuth } from '../providers'

type BillItem = {
  id: string
  month: string
  status: BillStatus
  final_due?: string
  paid_amount?: string
  member?: { id: string; name: string }
}

export default function MonthlyBillPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [status, setStatus] = useState<BillStatus>('PENDING')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<BillItem[]>([])

  useEffect(() => {
    if (!messId) return

    let alive = true
    api
      .getBillsByMess(messId, { month: `${month}-01`, status, limit: 20, sortBy: 'generated_at', sortOrder: 'desc' })
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
  }, [messId, month, status, busy])

  async function handleGenerate() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!month) return setMessage('Month is required.')

    setBusy(true)
    try {
      await api.generateMonthlyBills({ messId, month: `${month}-01` })
      setMessage('Monthly bills generated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate bills.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Monthly Bill" subtitle="Bill generation and overview" backHref="/" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Selected', month],
              ['Filter', LABELS.BILL_STATUSES[status]],
              ['Count', String(items.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#667b8a]">{label}</div>
                <div className="mt-1 text-[15px] font-black text-[#14324a]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[28px] p-4 space-y-4">
          <TextField label="Month" value={month} onChange={setMonth} type="month" />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={BILL_STATUSES}
            getLabel={(value) => LABELS.BILL_STATUSES[value]}
          />
          <div className="rounded-2xl border border-[#d8ecec] bg-[#f7fbfd] px-4 py-3 text-sm text-[#667b8a]">
            Generates bills for <span className="font-black text-[#14324a]">{month}</span> using backend billing logic.
          </div>
          {message ? <div className="rounded-2xl border border-[#ffd8c0] bg-[#fff4ea] px-4 py-3 text-sm font-semibold text-[#fc782d]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleGenerate}>
            Generate Bill
          </SubmitButton>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass flex items-center justify-between gap-3 rounded-[24px] p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-[#14324a]">{item.member?.name ?? 'Member Bill'}</div>
                <div className="mt-1 text-xs text-[#667b8a]">{item.month}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${item.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : item.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'}`}>
                  <BadgeCheck size={14} />
                  {LABELS.BILL_STATUSES[item.status]}
                </div>
                <IconActionLink
                  href={`/edit-monthly-bill?billId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                  label="Update bill"
                  icon={<Edit3 size={16} />}
                />
              </div>
            </div>
          ))}
          {!items.length ? <div className="rounded-[24px] bg-white/85 p-6 text-sm text-[#667b8a]">No bills loaded.</div> : null}
        </div>
      </div>
    </MobileShell>
  )
}
