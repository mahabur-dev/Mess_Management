'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { BILL_STATUSES, LABELS, type BillStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type BillRecord = {
  id: string
  month: string
  status: BillStatus
  final_due?: string | number | null
  paid_amount?: string | number | null
  member?: { id: string; name: string }
}

export default function EditMonthlyBillPage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const billId = searchParams.get('billId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''

  const [bill, setBill] = useState<BillRecord | null>(null)
  const [status, setStatus] = useState<BillStatus>('PENDING')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const subtitle = useMemo(() => (bill ? `${bill.member?.name ?? 'Bill'} - ${LABELS.BILL_STATUSES[bill.status]}` : 'Update monthly bill status'), [bill])

  useEffect(() => {
    if (!billId || !messId) return

    let alive = true
    api
      .getMonthlyBillById(billId)
      .then((res) => {
        if (!alive) return
        const found = (res.data ?? null) as BillRecord | null
        setBill(found)
        if (!found) {
          setMessage('Bill not found.')
          return
        }
        setStatus(found.status ?? 'PENDING')
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load bill details.')
      })

    return () => {
      alive = false
    }
  }, [billId, messId])

  async function handleSubmit() {
    setMessage('')
    if (!billId || !messId) return setMessage('Bill id or mess id is missing.')

    setBusy(true)
    try {
      await api.updateMonthlyBillStatus(billId, { status })
      setMessage('Bill status updated successfully.')
      router.push('/monthly-bill')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update bill.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Monthly Bill" subtitle={subtitle} backHref="/monthly-bill" />
      <div className="screen space-y-4">
        <section className="app-section app-form-section space-y-4">
          <div className="rounded-2xl bg-[#edfafa] px-4 py-3">
            <div className="text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">Bill</div>
            <div className="mt-1 text-label font-bold text-[#123748]">{bill?.member?.name ?? billId}</div>
            <div className="mt-1 text-caption text-[#65838b]">{bill?.month ?? 'No month'} - BDT {Number(bill?.final_due ?? 0).toLocaleString()}</div>
          </div>

          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={BILL_STATUSES}
            getLabel={(value) => LABELS.BILL_STATUSES[value]}
          />

          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Changes
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}
