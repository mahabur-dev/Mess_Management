'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { TextAreaField, TextField } from '@/components/mobile/form-controls'
import { DatePicker } from '@/components/mobile/date-picker'
import {
  DepositDetailsSummary,
  DepositInfoRow,
  DepositSectionTitle,
  depositInfoIcons,
  depositMemberName,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'
import { formatIsoDate, useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

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
  const { locale } = useLocale()
  const t = useTranslations('payments')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('payments')
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const depositId = searchParams.get('depositId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''

  const [deposit, setDeposit] = useState<DepositRecord | null>(null)
  const [form, setForm] = useState<FormState>({
    amount: '',
    date: formatIsoDate(),
    note: '',
  })
  const [busy, setBusy] = useState(false)

  useAutoDismiss(notice?.message ?? '', clearNotice)

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
          showMessage('depositNotFound', 'danger')
          return
        }
        setForm({
          amount: found.amount ? String(found.amount) : '',
          date: found.date ?? formatIsoDate(),
          note: found.note ?? '',
        })
      })
      .catch((error) => {
        if (!alive) return
        showError(error, 'loadDepositDetailsFailed')
      })

    return () => {
      alive = false
    }
  }, [depositId, messId])

  async function handleSubmit() {
    clearNotice()
    if (!depositId || !messId) return showMessage('missingDepositContext', 'danger')
    if (!form.amount) return showMessage('amountRequired', 'danger')

    setBusy(true)
    try {
      await api.updateDeposit(depositId, {
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim() || undefined,
      })
      showMessage('updateDepositSuccess', 'success')
      router.push('/deposits')
    } catch (error) {
      showError(error, 'updateDepositFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('depositDetails')} subtitle={deposit?.member?.name ?? t('updateDeposit')} backHref="/deposits" />
      <div className="screen space-y-4">
        <DepositDetailsSummary item={{ ...(deposit ?? { id: depositId, amount: 0 }), status: 'APPROVED', method: 'CASH', categories: ['Member Contribution'], payment_date: deposit?.date ?? deposit?.created_at } as DepositListRecord} />

        <div>
          <DepositSectionTitle title={t('depositInformation')} />
          <section className="app-list mt-3">
            <DepositInfoRow icon={depositInfoIcons.submittedBy} label={t('submittedBy')} value={depositMemberName(deposit as DepositListRecord | null, locale)} />
            <DepositInfoRow icon={depositInfoIcons.depositFor} label={t('depositFor')} value={deposit?.member?.name ?? t('memberFallback')} />
            <DepositInfoRow icon={depositInfoIcons.approval} label={t('approvalType')} value={t('autoApproved')} />
          </section>
        </div>

        <section className="app-section app-form-section space-y-4">
          <DepositSectionTitle title={t('editDeposit')} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label={t('amount')} value={form.amount} onChange={(amount) => setForm((prev) => ({ ...prev, amount }))} placeholder="1500" type="number" />
            <DatePicker label={t('date')} value={form.date} onChange={(date) => setForm((prev) => ({ ...prev, date }))} />
          </div>
          <TextAreaField
            label={t('note')}
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder={t('monthlyContribution')}
            rows={4}
          />

          {notice ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{notice.message}</div> : null}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => router.push('/deposits')} className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-semibold text-[#00777a]">
              <ArrowLeft size={17} /> {t('back')}
            </button>
            <button type="button" onClick={() => void handleSubmit()} disabled={busy} className="primary-btn flex h-12 items-center justify-center gap-2 rounded-[15px] p-0 text-label disabled:opacity-70">
              <Save size={17} /> {busy ? t('saving') : t('save')}
            </button>
          </div>
        </section>
      </div>
    </MobileShell>
  )
}
