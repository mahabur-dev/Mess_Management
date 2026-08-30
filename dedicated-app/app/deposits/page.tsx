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
import { formatIsoDate, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

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
  date: formatIsoDate(),
  note: '',
}

export default function DepositsPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('payments')
  const common = useTranslations('common')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('payments')
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [busy, setBusy] = useState(false)
  const [items, setItems] = useState<DepositItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(currentMonthValue())

  useAutoDismiss(notice?.message ?? '', clearNotice)

  useEffect(() => {
    if (!messId) return

    let alive = true
    setLoading(true)
    setLoadError(false)
    api
      .getDepositsByMess(messId, { billMonth: `${month}-01`, limit: 100, sortBy: 'date', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
        setTotalAmount((res as any).totalAmount ?? 0)
      })
      .catch((error) => {
        if (!alive) return
        setItems([])
        setTotalAmount(0)
        setLoadError(true)
        showError(error, 'loadDepositsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month, refreshKey])

  async function handleSubmit() {
    clearNotice()
    if (!messId) return showMessage('noMessSelected', 'danger')
    if (!form.memberId) return showMessage('selectDepositMember', 'danger')
    if (!form.amount) return showMessage('amountRequired', 'danger')

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
      showMessage('depositAddedSuccess', 'success')
      setShowForm(false)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      showError(error, 'addDepositFailed')
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
      <TopScreen title={t('title')} subtitle={t('memberLedger')} backHref="/" />
      <div className="screen deposit-page">
        <DepositMonthNavigator
          month={month}
          label={formatMonthLabel(month, locale)}
          onPrevious={() => setMonth((current) => shiftMonthValue(current, -1))}
          onNext={() => setMonth((current) => shiftMonthValue(current, 1))}
          onChange={setMonth}
        />

        <DepositOverviewCard
          total={totalAmount}
          entries={items.length}
          average={averageAmount}
          monthLabel={formatMonthLabel(month, locale)}
        />

        {notice && !showForm ? <div className="deposit-page-message" data-tone={notice.tone}>{notice.message}</div> : null}

        <DeferredFormSection
          open={showForm}
          title={t('addDeposit')}
          description={t('recordContributionHint')}
          actionLabel={t('addDeposit')}
          icon={<PlusCircle size={20} />}
          onOpen={() => setShowForm(true)}
          onClose={() => setShowForm(false)}
        >
          <DesignedSelect
            label={t('depositFor')}
            icon={expenseFormIcons.member}
            value={form.memberId}
            onChange={(event) => setForm((prev) => ({ ...prev, memberId: event.target.value }))}
            required
          >
            <option value="">{t('memberRequired')}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </DesignedSelect>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t('amount')}
              value={form.amount}
              onChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
              placeholder="1500"
              type="number"
            />
            <TextField
              label={t('date')}
              value={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
              type="date"
            />
          </div>
          <TextField
            label={t('note')}
            value={form.note}
            onChange={(note) => setForm((prev) => ({ ...prev, note }))}
            placeholder={t('monthlyContribution')}
          />
          <DepositManualNotice compact />
          {notice && showForm ? <div className="deposit-page-message" data-tone={notice.tone}>{notice.message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            {t('addDeposit')}
          </SubmitButton>
        </DeferredFormSection>

        {!showForm ? (
          <section className="deposit-ledger" aria-labelledby="deposit-ledger-title">
            <div className="deposit-ledger__heading">
              <div>
                <p>{t('transactionHistory')}</p>
                <h2 id="deposit-ledger-title">{t('depositLedger')}</h2>
              </div>
              <span>{loading ? '—' : t(visibleItems.length === 1 ? 'entryCount' : 'entriesCount', { count: format.number(visibleItems.length) })}</span>
            </div>

            <label className="deposit-ledger__search">
              <Search size={18} strokeWidth={2.2} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchMemberOrNote')}
                aria-label={t('searchDeposits')}
              />
            </label>

            <div className="deposit-ledger__list">
              {loading ? <DepositLedgerSkeleton /> : null}
              {!loading && loadError ? (
                <div className="deposit-ledger__empty" data-tone="error">
                  <WalletCards size={24} />
                  <strong>{t('unableToLoadLedger')}</strong>
                  <span>{t('loadLedgerLong')}</span>
                  <button type="button" onClick={() => setRefreshKey((current) => current + 1)}>{common('retry')}</button>
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
                  <strong>{search ? t('noMatchingDeposits') : t('noDepositsThisMonth')}</strong>
                  <span>{search ? t('differentSearchHint') : t('newContributionHint')}</span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {!showForm ? (
          <button type="button" onClick={() => setShowForm(true)} className="deposit-floating-action">
            <Plus size={21} strokeWidth={2.6} />
            <span>{t('newDeposit')}</span>
          </button>
        ) : null}
      </div>
    </MobileShell>
  )
}
