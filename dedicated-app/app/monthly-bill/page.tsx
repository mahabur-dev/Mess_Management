'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Edit3, FilePlus2 } from 'lucide-react'
import { IconActionLink } from '@/components/mobile/action-links'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
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
  const [showForm, setShowForm] = useState(false)

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
      setShowForm(false)
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
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#65838b]">{label}</div>
                <div className="mt-1 text-[15px] font-black text-[#123748]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {message && !showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}

        <DeferredFormSection
          open={showForm}
          title="Generate Bill"
          description="Open this form only when you need to generate a monthly bill run."
          actionLabel="Generate Monthly Bills"
          icon={<FilePlus2 size={20} />}
          onOpen={() => setShowForm(true)}
          onClose={() => setShowForm(false)}
        >
          <TextField label="Month" value={month} onChange={setMonth} type="month" />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={BILL_STATUSES}
            getLabel={(value) => LABELS.BILL_STATUSES[value]}
          />
          <div className="rounded-2xl border border-[#cfeeed] bg-[#edfafa] px-4 py-3 text-sm text-[#65838b]">
            Generates bills for <span className="font-black text-[#123748]">{month}</span> using backend billing logic.
          </div>
          {message && showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleGenerate}>
            Generate Bill
          </SubmitButton>
        </DeferredFormSection>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass flex items-center justify-between gap-3 rounded-[24px] p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-[#123748]">{item.member?.name ?? 'Member Bill'}</div>
                <div className="mt-1 text-xs text-[#65838b]">{item.month}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${item.status === 'PAID' ? 'bg-[#dff4f3] text-[#008d8c]' : item.status === 'PARTIAL' ? 'bg-[#edfafa] text-[#0aa0a0]' : 'bg-[#edfafa] text-[#00777a]'}`}>
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
          {!items.length ? <div className="rounded-[24px] bg-white/85 p-6 text-sm text-[#65838b]">No bills loaded.</div> : null}
        </div>
      </div>
    </MobileShell>
  )
}
