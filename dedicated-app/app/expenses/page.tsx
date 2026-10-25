'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CookingPot,
  ReceiptText,
  House,
  Landmark,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from 'lucide-react'
import {
  ExpenseListItem,
  type ExpenseListRecord,
} from '@/components/mobile/expense-design'
import {
  ExpenseSegmentedControl,
  ExpenseDetailsCta,
  ExpenseSummaryCard,
  ExpenseSurface,
} from '@/components/mobile/expense-ui'
import {
  normalizeExpenseApprovalStatus,
  type ExpenseApprovalStatus,
} from '@/components/mobile/expense-approval'
import { MobileSelectSheet, type MobileSelectOption } from '@/components/mobile/select-sheet'
import { MonthPicker } from '@/components/mobile/date-picker'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { FloatingActionMenu } from '@/components/mobile/floating-action-menu'
import { PersonalFormModal } from '@/features/personal/components/personal-form-modal'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { currentMonthValue } from '@/components/mobile/meals-design'
import { useAuth } from '../providers'
import {
  formatIsoDate,
  paymentStatusLabel,
  useLocale,
  useLocaleFormatters,
  useLocalizedNotice,
  useTranslations,
} from '@/lib/i18n'

type ExpenseSummary = {
  month?: string
  myView?: {
    foodBill?: number
    utilityBill?: number
    roomRent?: number
    total?: number
    transactionCount?: number
  }
  recentExpenses?: ExpenseListRecord[]
}

type ManagerOverview = {
  billing?: {
    status: 'DIRTY' | 'PROCESSING' | 'READY' | 'FAILED'
    requestedAt?: string | null
    calculatedAt?: string | null
  } | null
  totals?: {
    totalExpenses?: number
    totalUtility?: number
    fromDeposit?: number
    members?: number
  }
}

type FundBalances = {
  messDepositBalance: number
  collectedFundBalance: number
}

type ViewMode = 'MY' | 'MANAGER'
type ApprovalFilter = 'ALL' | ExpenseApprovalStatus
type MonthFilter = string

function monthKey(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 7)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}


function getExpenseMonth(expense: ExpenseListRecord) {
  return monthKey(expense.billingMonth ?? expense.billing_month ?? expense.expenseDate ?? expense.expense_date)
}

function ExpenseFilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string
  value: T
  options: Array<MobileSelectOption<T>>
  onChange: (value: T) => void
  icon: ReactNode
}) {
  return (
    <MobileSelectSheet
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      renderTrigger={({ open, selectedLabel, buttonProps }) => (
        <button
          {...buttonProps}
          className="flex h-12 min-w-0 items-center gap-2.5 rounded-[15px] border border-[#dce5ec] bg-white px-3 text-left shadow-[0_8px_18px_rgba(18,55,72,0.03)] transition focus:border-[#008d8c] focus:outline-none focus:ring-4 focus:ring-[#008d8c]/10"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#e8f8f7] text-[#008d8c]" aria-hidden="true">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-label font-semibold leading-tight text-[#123748]">{selectedLabel}</span>
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            className={`shrink-0 text-[#4f6375] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    />
  )
}

function ExpenseRecordsSection({
  expenses,
  loading,
  messId,
  statusFilter,
  onStatusFilterChange,
  monthFilter,
  onMonthFilterChange,
  search,
  onSearchChange,
  title,
}: {
  expenses: ExpenseListRecord[]
  loading: boolean
  messId: string
  statusFilter: ApprovalFilter
  onStatusFilterChange: (filter: ApprovalFilter) => void
  monthFilter: MonthFilter
  onMonthFilterChange: (filter: MonthFilter) => void
  search: string
  onSearchChange: (value: string) => void
  title: string
}) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('expenses')
  const meals = useTranslations('meals')
  const approvalOptions: Array<MobileSelectOption<ApprovalFilter>> = [
    { value: 'ALL', label: t('allStatuses') },
    { value: 'PENDING', label: paymentStatusLabel('PENDING', locale) },
    { value: 'APPROVED', label: paymentStatusLabel('APPROVED', locale) },
    { value: 'REJECTED', label: paymentStatusLabel('REJECTED', locale) },
  ]
  const filtered = expenses.filter((expense) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      normalizeExpenseApprovalStatus(expense.approvalStatus, expense.status) === statusFilter
    const matchesMonth = getExpenseMonth(expense) === monthFilter
    return matchesStatus && matchesMonth
  })

  return (
    <ExpenseSurface title={title} aside={<span className="text-caption font-semibold text-[#65838b]">{t('shownCount', { count: format.number(filtered.length) })}</span>}>
      <label className="expense-records-search mb-2.5 flex h-12 items-center gap-2.5 rounded-[15px] border border-[#dce5ec] bg-white px-3 shadow-[0_8px_18px_rgba(18,55,72,0.03)] transition focus-within:border-[#008d8c] focus-within:ring-4 focus-within:ring-[#008d8c]/10">
        <Search size={18} strokeWidth={2.2} className="shrink-0 text-[#008d8c]" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('searchExpenses')}
          aria-label={t('searchExpenses')}
          autoComplete="off"
          className="expense-records-search__input min-w-0 flex-1 text-label font-medium text-[#123748] placeholder:text-[#8a98ad]"
        />
      </label>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <ExpenseFilterSelect
          label={t('approvalStatus')}
          value={statusFilter}
          options={approvalOptions}
          onChange={onStatusFilterChange}
          icon={<SlidersHorizontal size={16} strokeWidth={2.35} />}
        />
        <MonthPicker
          label={meals('selectMonth')}
          value={monthFilter}
          onChange={onMonthFilterChange}
          renderTrigger={({ open, selectedLabel, buttonProps }) => (
            <button {...buttonProps} className="flex h-12 w-full items-center gap-2 rounded-[15px] border border-[#dce5ec] bg-white px-3 text-left text-label font-semibold text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10">
              <CalendarDays size={16} strokeWidth={2.35} className="shrink-0 text-[#008d8c]" />
              <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
              <ChevronDown size={16} className={`shrink-0 text-[#65838b] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        />
      </div>

      <div className="flush-list flush-list--home-panel">
        {filtered.map((item) => (
          <ExpenseListItem
            key={item.id}
            item={item}
            href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
            variant="horizontal"
            showChevron={false}
          />
        ))}
        {loading ? <LoadingIndicator variant="card" label={t('loadingExpenses')} /> : null}
        {!loading && !filtered.length ? <div className="expense-empty-state mx-3">{t('noMatchingExpenses')}</div> : null}
      </div>
    </ExpenseSurface>
  )
}

export default function ExpensesPage() {
  const format = useLocaleFormatters()
  const t = useTranslations('expenses')
  const common = useTranslations('common')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('expenses')
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [month, setMonth] = useState(currentMonthValue())
  const [view, setView] = useState<ViewMode>('MY')
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [managerData, setManagerData] = useState<ManagerOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [fundBalances, setFundBalances] = useState<FundBalances | null>(null)
  const [collectedAmount, setCollectedAmount] = useState('')
  const [collectedNote, setCollectedNote] = useState('')
  const [fundBusy, setFundBusy] = useState(false)
  const [fundModalOpen, setFundModalOpen] = useState(false)
  const [fundError, setFundError] = useState('')
  const [expenses, setExpenses] = useState<ExpenseListRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('ALL')
  const [recordsMonthFilter, setRecordsMonthFilter] = useState<MonthFilter>(month)
  const [expenseSearch, setExpenseSearch] = useState('')
  const [debouncedExpenseSearch, setDebouncedExpenseSearch] = useState('')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedExpenseSearch(expenseSearch.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [expenseSearch])

  useEffect(() => {
    if (!messId) return
    let active = true
    setLoading(true)
    clearNotice()

    api
      .getExpenseSummary(messId, `${month}-01`)
      .then((response) => {
        if (active) setSummary(response.data as ExpenseSummary)
      })
      .catch((error) => {
        if (active) showError(error, 'loadSummaryFailed')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [messId, month])

  useEffect(() => {
    if (!messId) return
    let active = true
    setRecordsLoading(true)

    api
      .getExpensesByMess(messId, {
        billingMonth: `${month}-01`,
        search: debouncedExpenseSearch || undefined,
        limit: 100,
        sortBy: 'expense_date',
        sortOrder: 'desc',
      })
      .then((response) => {
        if (active) setExpenses(Array.isArray(response.data) ? (response.data as ExpenseListRecord[]) : [])
      })
      .catch((error) => {
        if (!active) return
        setExpenses([])
        showError(error, 'loadExpensesFailed')
      })
      .finally(() => {
        if (active) setRecordsLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedExpenseSearch, messId, month])

  useEffect(() => {
    // The manager page now opens directly on operational fund controls.
    // if (!messId || !isManager || view !== 'MANAGER') return
    if (!messId || !isManager) return
    let active = true
    let billingTimer: ReturnType<typeof setTimeout> | null = null

    const loadManagerOverview = (initialLoad: boolean) => {
      if (initialLoad) setLoading(true)

      Promise.allSettled([
        api.getManagerMemberExpenses(messId, `${month}-01`),
        api.getFundBalances(messId),
      ])
        .then(([memberResult, balanceResult]) => {
          if (!active) return
          if (memberResult.status === 'fulfilled') {
            const nextManagerData = memberResult.value.data as ManagerOverview
            setManagerData(nextManagerData)
            if (
              nextManagerData.billing &&
              nextManagerData.billing.status !== 'READY' &&
              nextManagerData.billing.status !== 'FAILED'
            ) {
              billingTimer = setTimeout(() => loadManagerOverview(false), 1500)
            }
          }
          if (balanceResult.status === 'fulfilled') {
            setFundBalances(balanceResult.value.data)
          }
          const failed = [memberResult, balanceResult].find((result) => result.status === 'rejected')
          if (failed?.status === 'rejected') showError(failed.reason, 'partialOverviewFailed')
        })
        .finally(() => {
          if (active && initialLoad) setLoading(false)
        })
    }

    loadManagerOverview(true)

    return () => {
      active = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [isManager, messId, month])

  async function addCollectedFund() {
    clearNotice()
    setFundError('')
    const amount = Number(collectedAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setFundError(t('validMessFundAmount'))
      return
    }

    setFundBusy(true)
    try {
      const response = await api.createCollectedFund({
        messId,
        amount,
        date: formatIsoDate(),
        note: collectedNote.trim() || undefined,
      })
      setFundBalances(response.data.balances)
      setCollectedAmount('')
      setCollectedNote('')
      setFundModalOpen(false)
      showMessage('messFundRecorded', 'success')
    } catch {
      setFundError(t('recordMessFundFailed'))
    } finally {
      setFundBusy(false)
    }
  }

  function closeFundModal() {
    if (fundBusy) return
    setFundModalOpen(false)
    setFundError('')
    setCollectedAmount('')
    setCollectedNote('')
  }

  const my = summary?.myView
  const manager = managerData?.totals
  return (
    <MobileShell showBottomNavigation hasFloatingAction>
      <TopScreen
        title={isManager ? t('manageExpenses') : t('expenseManagement')}
        subtitle={isManager ? t('managerSubtitle') : user?.memberships?.[0]?.mess?.name ?? t('messExpenses')}
        backHref="/"
      />

      <div className="screen expense-screen">
        {/* Manager navigation is intentionally hidden while the previous UI is retained for future reuse.
        {isManager ? (
          <ExpenseSegmentedControl
            value={view}
            onChange={(value) => setView(value as ViewMode)}
            options={[
              { value: 'MY', label: t('myViewLabel'), icon: UserRound },
              { value: 'MANAGER', label: t('managerViewLabel'), icon: UsersRound },
            ]}
          />
        ) : null} */}

        {notice ? (
          <div
            className={
              notice.tone === 'success'
                ? 'rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]'
                : 'rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]'
            }
          >
            {notice.message}
          </div>
        ) : null}

        {!isManager ? (
          <>
            {/* The member overview is intentionally hidden so the page starts at All Expenses.
            <ExpenseSurface title={t('thisMonthOverview')}>
              <div className="expense-summary-grid">
                <ExpenseSummaryCard icon={CookingPot} label={t('food')} value={loading ? <LoadingIndicator size="sm" label={t('loadingFoodExpenses')} /> : format.money(my?.foodBill)} />
                <ExpenseSummaryCard icon={Zap} label={t('utility')} value={loading ? <LoadingIndicator size="sm" label={t('loadingUtilityExpenses')} /> : format.money(my?.utilityBill)} accent="blue" />
                <ExpenseSummaryCard icon={House} label={t('rent')} value={loading ? <LoadingIndicator size="sm" label={t('loadingRent')} /> : format.money(my?.roomRent)} accent="violet" />
                <ExpenseSummaryCard icon={WalletCards} label={t('total')} value={loading ? <LoadingIndicator size="sm" label={t('loadingTotalExpenses')} /> : format.money(my?.total)} caption={t('transactions', { count: format.number(my?.transactionCount ?? 0) })} accent="green" />
              </div>

              <ExpenseDetailsCta href="/monthly-bill" title={t('totalExpensesThisMonth')} subtitle={t('foodUtilityRent')} buttonLabel={t('details')} />
            </ExpenseSurface>
            */}
          </>
        ) : (
          <>
            {/* The manager summary cards are intentionally hidden so Available Funds is first.
            <ExpenseSurface>
              <div className="grid grid-cols-2 gap-2.5">
                <ExpenseSummaryCard icon={CircleDollarSign} label={t('total')} value={format.money(manager?.totalExpenses)} />
                <ExpenseSummaryCard icon={Zap} label={t('utility')} value={format.money(manager?.totalUtility)} accent="blue" />
                <ExpenseSummaryCard icon={Landmark} label={t('fromDeposit')} value={format.money(manager?.fromDeposit)} accent="green" />
                <ExpenseSummaryCard icon={UsersRound} label={t('members')} value={format.number(manager?.members ?? 0)} accent="violet" />
              </div>
            </ExpenseSurface>
            */}

            <ExpenseSurface title={t('availableFunds')}>
              <div className="grid grid-cols-2 gap-2.5">
                <ExpenseSummaryCard
                  icon={Landmark}
                  label={t('messDeposit')}
                  value={format.money(fundBalances?.messDepositBalance)}
                  accent="green"
                />
                <ExpenseSummaryCard
                  icon={UsersRound}
                  label={t('messFund')}
                  value={format.money(fundBalances?.collectedFundBalance)}
                  accent="violet"
                />
              </div>
              {/* The inline fund form is retained here for possible future reuse.
              <div className="mt-4 grid gap-2.5">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={collectedAmount}
                  onChange={(event) => setCollectedAmount(event.target.value)}
                  className="h-12 rounded-[15px] border border-[#dce5ec] bg-white px-4 text-label font-medium text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                  placeholder={t('messFundAmount')}
                />
                <input
                  value={collectedNote}
                  onChange={(event) => setCollectedNote(event.target.value.slice(0, 250))}
                  className="h-12 rounded-[15px] border border-[#dce5ec] bg-white px-4 text-label font-medium text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                  placeholder={t('collectionNoteOptional')}
                />
                <button
                  type="button"
                  onClick={() => void addCollectedFund()}
                  disabled={fundBusy}
                  className="expense-secondary-action disabled:opacity-60"
                >
                  <Plus size={18} /> {fundBusy ? t('recording') : t('recordMessFund')}
                </button>
              </div>
              */}
            </ExpenseSurface>

          </>
        )}

        <ExpenseRecordsSection
          expenses={expenses}
          loading={recordsLoading}
          messId={messId}
          statusFilter={approvalFilter}
          onStatusFilterChange={setApprovalFilter}
          monthFilter={recordsMonthFilter}
          onMonthFilterChange={(value) => {
            setRecordsMonthFilter(value)
            setMonth(value)
          }}
          search={expenseSearch}
          onSearchChange={setExpenseSearch}
          title={isManager ? t('expenseSubmissions') : t('allExpenses')}
        />
      </div>

      <FloatingActionMenu
        label={t('addExpenseOrUtility')}
        items={[
          {
            href: '/add-expense',
            label: t('addExpense'),
            icon: <ReceiptText size={20} strokeWidth={2.3} />,
          },
          {
            href: '/add-utility',
            label: t('addUtility'),
            icon: <Zap size={20} strokeWidth={2.3} />,
          },
          ...(isManager
            ? [{
                label: t('addMessFund'),
                icon: <Landmark size={20} strokeWidth={2.3} />,
                onSelect: () => {
                  setFundError('')
                  setFundModalOpen(true)
                },
              }]
            : []),
        ]}
      />

      <PersonalFormModal
        id="add-mess-fund"
        open={isManager && fundModalOpen}
        busy={fundBusy}
        icon={Landmark}
        eyebrow={t('availableFunds')}
        title={t('addMessFund')}
        description={t('addMessFundDescription')}
        closeLabel={common('close')}
        onClose={closeFundModal}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void addCollectedFund()
          }}
        >
          <div className="space-y-4 px-5 py-5">
            <label className="block">
              <span className="mb-2 block text-label font-semibold text-[#1d3a42]">{t('messFundAmount')}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={collectedAmount}
                onChange={(event) => {
                  setCollectedAmount(event.target.value)
                  if (fundError) setFundError('')
                }}
                disabled={fundBusy}
                aria-invalid={Boolean(fundError)}
                className="h-12 w-full rounded-[14px] border border-[#d6e5e8] bg-white px-3.5 text-label font-medium text-[#1d3a42] outline-none transition placeholder:text-[#9aaab2] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10 disabled:bg-[#f5f7f8]"
                placeholder={t('messFundAmount')}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-label font-semibold text-[#1d3a42]">{t('collectionNoteOptional')}</span>
              <textarea
                value={collectedNote}
                onChange={(event) => setCollectedNote(event.target.value.slice(0, 250))}
                rows={3}
                maxLength={250}
                disabled={fundBusy}
                className="min-h-[88px] w-full resize-y rounded-[14px] border border-[#d6e5e8] bg-white px-3.5 py-3 text-label font-medium text-[#1d3a42] outline-none transition placeholder:text-[#9aaab2] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10 disabled:bg-[#f5f7f8]"
                placeholder={t('collectionNoteOptional')}
              />
            </label>

            {fundError ? <div className="ui-notice ui-notice--danger" role="alert">{fundError}</div> : null}
          </div>

          <footer className="border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4">
            <button type="submit" className="app-modal-primary inline-flex w-full items-center justify-center gap-2 px-3 text-label" disabled={fundBusy}>
              <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              {fundBusy ? t('recording') : t('addMessFund')}
            </button>
          </footer>
        </form>
      </PersonalFormModal>
    </MobileShell>
  )
}
