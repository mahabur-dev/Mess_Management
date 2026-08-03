'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CookingPot,
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
  formatTaka,
  type ExpenseListRecord,
} from '@/components/mobile/expense-design'
import {
  ExpenseSegmentedControl,
  ExpenseDetailsCta,
  ExpenseSummaryCard,
  ExpenseSurface,
  MemberInitials,
} from '@/components/mobile/expense-ui'
import {
  normalizeExpenseApprovalStatus,
  type ExpenseApprovalStatus,
} from '@/components/mobile/expense-approval'
import { MobileSelectSheet, type MobileSelectOption } from '@/components/mobile/select-sheet'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { currentMonthValue } from '@/components/mobile/meals-design'
import { useAuth } from '../providers'

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

type ManagerMember = {
  member?: { id: string; name?: string; email?: string }
  totalCost?: number
  depositPaid?: number
  due?: number
  status?: string
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
  members?: ManagerMember[]
}

type FundBalances = {
  messDepositBalance: number
  collectedFundBalance: number
}

type ViewMode = 'MY' | 'MANAGER'
type MemberFilter = 'ALL' | 'DUE' | 'PAID'
type MessageTone = 'SUCCESS' | 'ERROR'
type ApprovalFilter = 'ALL' | ExpenseApprovalStatus
type MonthFilter = string

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const APPROVAL_FILTER_OPTIONS: Array<MobileSelectOption<ApprovalFilter>> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

function monthKey(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 7)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(value: string) {
  if (value === 'ALL') return 'All Months'
  const date = new Date(`${value}-01T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : MONTH_FORMATTER.format(date)
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
            <span className="block text-caption font-semibold leading-tight text-[#65838b]">{label}</span>
            <span className="mt-0.5 block truncate text-label font-bold leading-tight text-[#123748]">{selectedLabel}</span>
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

function getStatus(member: ManagerMember) {
  if (Number(member.due ?? 0) <= 0) return 'PAID'
  if (Number(member.depositPaid ?? 0) > 0) return 'PARTIAL'
  return 'DUE'
}

function MemberStatus({ member }: { member: ManagerMember }) {
  const status = getStatus(member)
  const styles = {
    PAID: 'bg-[#eaf7ec] text-[#15953a]',
    PARTIAL: 'bg-[#fff2e6] text-[#e36c0a]',
    DUE: 'bg-[#ffebeb] text-[#e02d37]',
  } as const
  const label = status === 'PAID' ? 'Paid' : status === 'PARTIAL' ? 'Partial' : 'Due'
  return <span className={`rounded-full px-2.5 py-1 text-caption font-bold ${styles[status]}`}>{label}</span>
}

function ExpenseRecordsSection({
  expenses,
  loading,
  messId,
  statusFilter,
  onStatusFilterChange,
  monthFilter,
  onMonthFilterChange,
  title,
}: {
  expenses: ExpenseListRecord[]
  loading: boolean
  messId: string
  statusFilter: ApprovalFilter
  onStatusFilterChange: (filter: ApprovalFilter) => void
  monthFilter: MonthFilter
  onMonthFilterChange: (filter: MonthFilter) => void
  title: string
}) {
  const filtered = expenses.filter((expense) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      normalizeExpenseApprovalStatus(expense.approvalStatus, expense.status) === statusFilter
    const matchesMonth = getExpenseMonth(expense) === monthFilter
    return matchesStatus && matchesMonth
  })

  return (
    <ExpenseSurface title={title} aside={<span className="text-caption font-bold text-[#65838b]">{filtered.length} shown</span>}>
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <ExpenseFilterSelect
          label="Status"
          value={statusFilter}
          options={APPROVAL_FILTER_OPTIONS}
          onChange={onStatusFilterChange}
          icon={<SlidersHorizontal size={16} strokeWidth={2.35} />}
        />
        <label className="flex h-12 items-center gap-2 rounded-[15px] border border-[#dce5ec] bg-white px-3 text-label font-semibold text-[#123748]">
          <CalendarDays size={16} strokeWidth={2.35} className="text-[#008d8c]" />
          <input
            type="month"
            value={monthFilter}
            onChange={(event) => onMonthFilterChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
      </div>

      <div className="flush-list flush-list--home-panel">
        {filtered.map((item) => (
          <ExpenseListItem
            key={item.id}
            item={item}
            href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
            variant="horizontal"
          />
        ))}
        {loading ? <LoadingIndicator variant="card" label="Loading expenses" /> : null}
        {!loading && !filtered.length ? <div className="expense-empty-state mx-3">No matching expenses found.</div> : null}
      </div>
    </ExpenseSurface>
  )
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [month, setMonth] = useState(currentMonthValue())
  const [view, setView] = useState<ViewMode>('MY')
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [managerData, setManagerData] = useState<ManagerOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<MessageTone>('ERROR')
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('ALL')
  const [fundBalances, setFundBalances] = useState<FundBalances | null>(null)
  const [collectedAmount, setCollectedAmount] = useState('')
  const [collectedNote, setCollectedNote] = useState('')
  const [fundBusy, setFundBusy] = useState(false)
  const [expenses, setExpenses] = useState<ExpenseListRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('ALL')
  const [recordsMonthFilter, setRecordsMonthFilter] = useState<MonthFilter>(month)

  useEffect(() => {
    if (!messId) return
    let active = true
    setLoading(true)
    setMessage('')
    setMessageTone('ERROR')

    api
      .getExpenseSummary(messId, `${month}-01`)
      .then((response) => {
        if (active) setSummary(response.data as ExpenseSummary)
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Failed to load expense summary.')
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
      .getExpensesByMess(messId, { billingMonth: `${month}-01`, limit: 100, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((response) => {
        if (active) setExpenses(Array.isArray(response.data) ? (response.data as ExpenseListRecord[]) : [])
      })
      .catch((error) => {
        if (!active) return
        setExpenses([])
        setMessageTone('ERROR')
        setMessage(error instanceof Error ? error.message : 'Failed to load expenses.')
      })
      .finally(() => {
        if (active) setRecordsLoading(false)
      })

    return () => {
      active = false
    }
  }, [messId, month])

  useEffect(() => {
    if (!messId || !isManager || view !== 'MANAGER') return
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
          const errors = [memberResult, balanceResult]
            .filter((result) => result.status === 'rejected')
            .map((result) =>
              result.status === 'rejected' && result.reason instanceof Error
                ? result.reason.message
                : 'Part of the manager expense overview could not be loaded.',
            )
          if (errors.length) {
            setMessageTone('ERROR')
            setMessage(errors.join(' '))
          }
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
  }, [isManager, messId, month, view])

  async function addCollectedFund() {
    setMessage('')
    setMessageTone('ERROR')
    const amount = Number(collectedAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid collected fund amount.')
      return
    }

    setFundBusy(true)
    try {
      const response = await api.createCollectedFund({
        messId,
        amount,
        date: new Date().toISOString().slice(0, 10),
        note: collectedNote.trim() || undefined,
      })
      setFundBalances(response.data.balances)
      setCollectedAmount('')
      setCollectedNote('')
      setMessageTone('SUCCESS')
      setMessage('Collected fund recorded successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to record collected fund.')
    } finally {
      setFundBusy(false)
    }
  }

  const my = summary?.myView
  const manager = managerData?.totals
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (managerData?.members ?? []).filter((item) => {
      const status = getStatus(item)
      const matchesFilter = memberFilter === 'ALL' || (memberFilter === 'DUE' ? status !== 'PAID' : status === 'PAID')
      const searchable = `${item.member?.name ?? ''} ${item.member?.email ?? ''}`.toLowerCase()
      return matchesFilter && (!query || searchable.includes(query))
    })
  }, [managerData?.members, memberFilter, search])

  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={view === 'MANAGER' ? 'Manage Expenses' : 'Expense Management'}
        subtitle={view === 'MANAGER' ? 'Monitor member costs and dues' : user?.memberships?.[0]?.mess?.name ?? 'Mess expenses'}
        backHref="/"
      />

      <div className="screen expense-screen">
        {isManager ? (
          <ExpenseSegmentedControl
            value={view}
            onChange={(value) => setView(value as ViewMode)}
            options={[
              { value: 'MY', label: 'My View', icon: UserRound },
              { value: 'MANAGER', label: 'Manager View', icon: UsersRound },
            ]}
          />
        ) : null}

        {message ? (
          <div
            className={
              messageTone === 'SUCCESS'
                ? 'rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]'
                : 'rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]'
            }
          >
            {message}
          </div>
        ) : null}

        {view === 'MY' ? (
          <>
            <ExpenseSurface title="This Month Overview">
              <div className="expense-summary-grid">
                <ExpenseSummaryCard icon={CookingPot} label="Food" value={loading ? <LoadingIndicator size="sm" label="Loading food expenses" /> : formatTaka(my?.foodBill)} />
                <ExpenseSummaryCard icon={Zap} label="Utility" value={loading ? <LoadingIndicator size="sm" label="Loading utility expenses" /> : formatTaka(my?.utilityBill)} accent="blue" />
                <ExpenseSummaryCard icon={House} label="Rent" value={loading ? <LoadingIndicator size="sm" label="Loading rent" /> : formatTaka(my?.roomRent)} accent="violet" />
                <ExpenseSummaryCard icon={WalletCards} label="Total" value={loading ? <LoadingIndicator size="sm" label="Loading total expenses" /> : formatTaka(my?.total)} caption={`${my?.transactionCount ?? 0} txns`} accent="green" />
              </div>

              <ExpenseDetailsCta href="/monthly-bill" title="Total Expenses This Month" subtitle="Food, utility and rent" buttonLabel="Details" />
            </ExpenseSurface>

            {!isManager ? (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/add-expense" className="expense-primary-action">
                  <Plus size={18} /> Add Expense
                </Link>
                <Link href="/add-utility" className="expense-secondary-action">
                  <Zap size={18} /> Add Utility
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <ExpenseSurface>
              <div>
                <label className="relative block">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65838b]" size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-12 w-full rounded-[15px] border border-[#dce5ec] bg-white pl-11 pr-3 text-label font-medium text-[#123748] outline-none placeholder:text-[#8293a5] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                    placeholder="Search member by name or email"
                  />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  ['ALL', 'All'],
                  ['DUE', 'With Due'],
                  ['PAID', 'Fully Paid'],
                ] as Array<[MemberFilter, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMemberFilter(value)}
                    className={`h-9 rounded-full border text-caption font-bold ${memberFilter === value ? 'border-[#008d8c] bg-[#008d8c] text-white' : 'border-[#dce5ec] bg-white text-[#65838b]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <ExpenseSummaryCard icon={CircleDollarSign} label="Total" value={formatTaka(manager?.totalExpenses)} />
                <ExpenseSummaryCard icon={Zap} label="Utility" value={formatTaka(manager?.totalUtility)} accent="blue" />
                <ExpenseSummaryCard icon={Landmark} label="Deposit" value={formatTaka(manager?.fromDeposit)} accent="green" />
                <ExpenseSummaryCard icon={UsersRound} label="Members" value={manager?.members ?? 0} accent="violet" />
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Available Funds">
              <div className="grid grid-cols-2 gap-2.5">
                <ExpenseSummaryCard
                  icon={Landmark}
                  label="Mess Deposit"
                  value={formatTaka(fundBalances?.messDepositBalance)}
                  accent="green"
                />
                <ExpenseSummaryCard
                  icon={UsersRound}
                  label="Collected Fund"
                  value={formatTaka(fundBalances?.collectedFundBalance)}
                  accent="violet"
                />
              </div>
              <div className="mt-4 grid gap-2.5">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={collectedAmount}
                  onChange={(event) => setCollectedAmount(event.target.value)}
                  className="h-12 rounded-[15px] border border-[#dce5ec] bg-white px-4 text-label font-medium text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                  placeholder="Collected fund amount"
                />
                <input
                  value={collectedNote}
                  onChange={(event) => setCollectedNote(event.target.value.slice(0, 250))}
                  className="h-12 rounded-[15px] border border-[#dce5ec] bg-white px-4 text-label font-medium text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                  placeholder="Collection note (optional)"
                />
                <button
                  type="button"
                  onClick={() => void addCollectedFund()}
                  disabled={fundBusy}
                  className="expense-secondary-action disabled:opacity-60"
                >
                  <Plus size={18} /> {fundBusy ? 'Recording...' : 'Record Collected Fund'}
                </button>
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Member Overview" aside={<span className="text-caption font-bold text-[#65838b]">{filteredMembers.length} shown</span>}>
              <div className="-mx-3 overflow-hidden rounded-[16px] border border-[#edf1f4]">
                {filteredMembers.map((item, index) => (
                  <div key={item.member?.id ?? index} className="flex items-center gap-3 border-b border-[#edf1f4] bg-white px-3 py-3 last:border-b-0">
                    <MemberInitials name={item.member?.name} accent={index % 2 ? 'blue' : 'teal'} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-label font-bold text-[#123748]">{item.member?.name ?? 'Member'}</div>
                      <div className="mt-0.5 truncate text-caption font-medium text-[#65838b]">{item.member?.email ?? 'No email'}</div>
                    </div>
                    <div className="hidden text-right min-[380px]:block">
                      <div className="text-caption font-semibold text-[#65838b]">Total</div>
                      <div className="text-label font-bold text-[#008d8c]">{formatTaka(item.totalCost)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-label font-bold ${Number(item.due ?? 0) > 0 ? 'text-[#e02d37]' : 'text-[#65838b]'}`}>{formatTaka(item.due)}</div>
                      <MemberStatus member={item} />
                    </div>
                  </div>
                ))}
                {!loading && !filteredMembers.length ? <div className="expense-empty-state">No matching members found.</div> : null}
              </div>
            </ExpenseSurface>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/add-expense" className="expense-primary-action">
                <Plus size={18} /> Add Expense
              </Link>
              <Link href="/add-utility" className="expense-secondary-action">
                <Zap size={18} /> Add Utility
              </Link>
            </div>
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
          title={isManager && view === 'MANAGER' ? 'Expense Submissions' : 'All Expenses'}
        />
      </div>
    </MobileShell>
  )
}
