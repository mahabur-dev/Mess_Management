'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton } from '@/components/mobile/form-controls'
import { InlineNotice } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { BILL_STATUSES, type BillStatus } from '@/lib/form-options'
import { billStatusLabel, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
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
  const { locale } = useLocale()
  const t = useTranslations('billing')
  const format = useLocaleFormatters()
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('billing')
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const billId = searchParams.get('billId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''

  const [bill, setBill] = useState<BillRecord | null>(null)
  const [status, setStatus] = useState<BillStatus>('PENDING')
  const [busy, setBusy] = useState(false)

  const subtitle = useMemo(
    () => (bill ? `${bill.member?.name ?? t('bill')} - ${billStatusLabel(bill.status, locale)}` : t('updateBillStatus')),
    [bill, locale, t],
  )

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
          showMessage('billNotFound', 'danger')
          return
        }
        setStatus(found.status ?? 'PENDING')
      })
      .catch((error) => {
        if (!alive) return
        showError(error, 'loadBillFailed')
      })

    return () => {
      alive = false
    }
  }, [billId, messId, showError, showMessage])

  async function handleSubmit() {
    clearNotice()
    if (!billId || !messId) return showMessage('missingBillContext', 'danger')

    setBusy(true)
    try {
      await api.updateMonthlyBillStatus(billId, { status })
      showMessage('billStatusUpdated', 'success')
      router.push('/monthly-bill')
    } catch (error) {
      showError(error, 'updateBillFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('editMonthlyBill')} subtitle={subtitle} backHref="/monthly-bill" />
      <div className="screen space-y-4">
        <section className="app-section app-form-section space-y-4">
          <div className="rounded-2xl bg-[#edfafa] px-4 py-3">
            <div className="text-caption font-semibold uppercase tracking-[0.12em] text-[#65838b]">{t('bill')}</div>
            <div className="mt-1 text-label font-semibold text-[#123748]">{bill?.member?.name ?? billId}</div>
            <div className="mt-1 text-caption text-[#65838b]">
              {bill?.month ? format.month(bill.month) : t('noMonth')} - {format.money(bill?.final_due)}
            </div>
          </div>

          <SelectField
            label={t('status')}
            value={status}
            onChange={setStatus}
            options={BILL_STATUSES}
            getLabel={(value) => billStatusLabel(value, locale)}
          />

          {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            {t('saveChanges')}
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}
