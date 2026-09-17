'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Hourglass, PlusCircle, UserRound, WalletCards } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { SubmitButton } from '@/components/mobile/form-controls'
import { DepositEntryForm } from '@/components/mobile/deposit-entry-form'
import { MealMonthSelector, currentMonthValue } from '@/components/mobile/meals-design'
import {
  DepositListItem,
  DepositSectionTitle,
  DepositStatCard,
  DepositStatPanel,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { appHref } from '@/lib/routes'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'
import { formatIsoDate, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type PaymentItem = {
  id: string
  amount: string | number
  status: PaymentStatus
  method: PaymentMethod
  payment_date?: string
  categories?: string[] | null
  note?: string | null
  member?: { id: string; name: string; avatar_url?: string | null }
}

type FormState = {
  purchasedBy: string
  amount: string
  method: PaymentMethod
  transactionId: string
  note: string
  paymentDate: string
}

type DepositSummary = {
  approved: number
  myApproved: number
  pending: number
}

function todayDateValue() {
  return formatIsoDate()
}

function createInitialForm(paymentDate = ''): FormState {
  return {
    purchasedBy: '',
    amount: '',
    method: 'BKASH',
    transactionId: '',
    note: '',
    paymentDate,
  }
}

export default function PaymentsPage() {
  const format = useLocaleFormatters()
  const t = useTranslations('payments')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('payments')
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const isManager = canManageMess(user)
  const [items, setItems] = useState<PaymentItem[]>([])
  const [form, setForm] = useState<FormState>(() => createInitialForm())
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [summary, setSummary] = useState<DepositSummary>({ approved: 0, myApproved: 0, pending: 0 })
  const [month, setMonth] = useState(currentMonthValue())

  useAutoDismiss(notice?.message ?? '', clearNotice)

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)

    Promise.all([
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, limit: 20, sortBy: 'payment_date', sortOrder: 'desc' }),
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, status: 'APPROVED', limit: 1 }),
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, status: 'PENDING', limit: 1 }),
      api.getPaymentsByMess(messId, { billMonth: `${month}-01`, status: 'APPROVED', memberId: user?.id, limit: 1 }),
    ])
      .then(([recentRes, approvedRes, pendingRes, myApprovedRes]) => {
        if (!alive) return
        setItems(Array.isArray(recentRes.data) ? recentRes.data : [])
        setSummary({
          approved: Number((approvedRes as { totalAmount?: number }).totalAmount ?? 0),
          pending: Number((pendingRes as { totalAmount?: number }).totalAmount ?? 0),
          myApproved: Number((myApprovedRes as { totalAmount?: number }).totalAmount ?? 0),
        })
      })
      .catch((error) => {
        if (!alive) return
        setItems([])
        setSummary({ approved: 0, myApproved: 0, pending: 0 })
        showError(error, 'loadDepositsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, user?.id, busy, month])

  async function handleSubmit() {
    clearNotice()
    if (!messId) return showMessage('noMessSelected', 'danger')
    if (!form.amount) return showMessage('amountRequired', 'danger')

    setBusy(true)
    try {
      await api.createPayment({
        messId,
        purchasedBy: form.purchasedBy || undefined,
        amount: Number(form.amount),
        method: form.method,
        transactionId: form.transactionId.trim() || undefined,
        note: form.note.trim() || undefined,
        paymentDate: form.paymentDate,
      })
      setForm(createInitialForm())
      setShowForm(false)
      showMessage(isManager ? 'depositAddedApproved' : 'depositSubmitted', 'success')
    } catch (error) {
      showError(error, 'submitDepositFailed')
    } finally {
      setBusy(false)
    }
  }

  function openDepositForm() {
    setForm((current) => (current.paymentDate ? current : { ...current, paymentDate: todayDateValue() }))
    setShowForm(true)
  }

  return (
    <MobileShell showBottomNavigation>
      <TopScreen title={showForm ? t('submitDeposit') : t('deposit')} subtitle={showForm ? t('manualEntry') : t('submissions')} backHref="/" />
      <div className="screen space-y-4">
        {!showForm ? (
          <>
            <MealMonthSelector month={month} onChange={setMonth} />

            <DepositStatPanel>
              <DepositStatCard title={t('myDeposit')} value={loading ? <LoadingIndicator size="sm" label={t('loadingMyDeposit')} /> : format.money(summary.myApproved)} icon={UserRound} compact />
              <DepositStatCard title={t('totalDeposit')} value={loading ? <LoadingIndicator size="sm" label={t('loadingTotalDeposit')} /> : format.money(summary.approved)} icon={WalletCards} tone="blue" compact />
              <DepositStatCard title={t('pendingDeposit')} value={loading ? <LoadingIndicator size="sm" label={t('loadingPendingDeposit')} /> : format.money(summary.pending)} icon={Hourglass} tone="orange" compact />
            </DepositStatPanel>
          </>
        ) : null}

        {notice && !showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{notice.message}</div> : null}

        {showForm ? (
          <DeferredFormSection
            open={showForm}
            title={t('submitDeposit')}
            description={t('manualNotice')}
            actionLabel={t('submitDeposit')}
            icon={<PlusCircle size={20} />}
            onOpen={openDepositForm}
            onClose={() => setShowForm(false)}
          >
            <DepositEntryForm
              method={form.method}
              onMethodChange={(method) => setForm((prev) => ({ ...prev, method }))}
              amount={form.amount}
              onAmountChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
              date={form.paymentDate}
              onDateChange={(paymentDate) => setForm((prev) => ({ ...prev, paymentDate }))}
              paidBy={form.purchasedBy}
              onPaidByChange={(purchasedBy) => setForm((prev) => ({ ...prev, purchasedBy }))}
              showPaidBy={isManager}
              members={members}
              transactionId={form.transactionId}
              onTransactionIdChange={(transactionId) => setForm((prev) => ({ ...prev, transactionId }))}
              note={form.note}
              onNoteChange={(note) => setForm((prev) => ({ ...prev, note }))}
            />
            {notice && showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{notice.message}</div> : null}
            <SubmitButton busy={busy} onClick={handleSubmit}>
              {t('submitDeposit')}
            </SubmitButton>
          </DeferredFormSection>
        ) : null}

        {!showForm ? (
          <section className="app-section">
            <DepositSectionTitle
              title={t('recentDeposits')}
              action={
                <Link href={appHref(`/payments/all?month=${encodeURIComponent(month)}`)} className="text-label font-semibold text-[#008d8c]">
                  {t('viewAll')}
                </Link>
              }
            />
            <div className="flush-list flush-list--panel mt-4">
              {loading ? <LoadingIndicator variant="card" label={t('loadingDeposits')} className="mx-4 !w-auto" /> : null}
              {!loading && items.slice(0, 5).map((item, index) => (
                <DepositListItem
                  key={item.id}
                  item={item as DepositListRecord}
                  index={index}
                  href={`/edit-payment?paymentId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                  variant="horizontal"
                />
              ))}
              {!loading && !items.length ? <div className="mx-4 rounded-[12px] bg-[#edfafa] p-5 text-label font-semibold text-[#65838b]">{t('noDeposits')}</div> : null}
            </div>
          </section>
        ) : null}

      </div>
      {!showForm ? (
        <button type="button" onClick={openDepositForm} aria-label={t('addDeposit')} title={t('addDeposit')} className="floating-action-link">
          <span className="floating-action-link__plus" aria-hidden="true">+</span>
        </button>
      ) : null}
    </MobileShell>
  )
}
